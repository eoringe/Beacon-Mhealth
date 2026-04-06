import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow, Colors as ThemeColors } from '@/constants/theme';
import LinearGradient from 'react-native-linear-gradient';
import { SUPPORT_ACTIVITIES, SUPPORT_HEADER } from '@/constants/asdSupportActivities';

const VIBRANT = {
    indigo: ['#6366F1', '#4F46E5'],
    violet: ['#5813f9ff', '#5d00ffff'],
    emerald: ['#10B981', '#059669'],
    rose: ['#F43F5E', '#E11D48'],
    amber: ['#F59E0B', '#D97706'],
    lavender: '#F5F3FF',
    lavenderDark: '#E0E7FF',
};

const QUESTIONS = [
    { id: 1, text: "Does your child look at you when you call their name?", type: 'reverse' },
    { id: 2, text: "Does your child make eye contact during interaction? (brief eye contact counts)", type: 'reverse' },
    { id: 3, text: "Does your child point to show you something interesting?", type: 'reverse' },
    { id: 4, text: "Does your child try to share enjoyment with you? (e.g., brings or shows objects)", type: 'reverse' },
    { id: 5, text: "Does your child copy your actions? (e.g., clapping, waving, high-5)", type: 'reverse' },
    { id: 6, text: "Does your child use words, sounds, or gestures to communicate needs?", type: 'reverse' },
    { id: 7, text: "Does your child respond when spoken to (even if not using words)?", type: 'reverse' },
    { id: 8, text: "Does your child engage in simple back-and-forth interaction? (e.g., taking turns in play or sounds)", type: 'reverse' },
    { id: 9, text: "Does your child understand simple instructions? (e.g., “bring the cup”)", type: 'reverse' },
    { id: 10, text: "Does your child repeat the same sounds, actions, or movements over and over? (e.g., humming, hand flapping, lining objects)", type: 'normal' },
    { id: 11, text: "Does your child play with toys or objects unusually? (e.g., spinning wheels repeatedly)", type: 'normal' },
    { id: 12, text: "Does your child become very upset by small changes in routine or environment?", type: 'normal' },
    { id: 13, text: "Does your child show unusual reactions to sounds, textures, or touch? (e.g., covering ears, avoiding certain clothes/foods)", type: 'normal' },
];

interface AsdScreening {
    id: string;
    created_at: string;
    score: number;
    risk_level: 'Low' | 'Moderate' | 'High';
    responses: Record<number, boolean>;
}

export default function AsdChecklistScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colorScheme, isDark } = useTheme();
    const childContext = useChild() as any;
    const {
        selectedChild,
        saveAsdScreening,
        asdLoading,
        asdScreenings,
        refreshAsdScreenings
    } = childContext;

    const [step, setStep] = useState('intro'); // intro, questions, result, history-detail
    const [answers, setAnswers] = useState<Record<number, boolean>>({});
    const [result, setResult] = useState<{ score: number, riskLevel: string } | null>(null);
    const [selectedHistory, setSelectedHistory] = useState<AsdScreening | null>(null);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);

    useEffect(() => {
        if (selectedChild?.id) {
            refreshAsdScreenings(selectedChild.id);
        }
    }, [selectedChild]);

    // Calculate lockout status (30 days)
    const lastScreening = asdScreenings && asdScreenings.length > 0 ? asdScreenings[0] : null;
    const nextAvailableDate = lastScreening
        ? new Date(new Date(lastScreening.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;
    const isLocked = nextAvailableDate && nextAvailableDate > new Date() && step !== 'result';
    const daysToGo = nextAvailableDate ? Math.ceil((nextAvailableDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const handleStart = () => {
        if (!selectedChild) {
            Alert.alert("Child Required", "Please select a child from the dashboard first.");
            return;
        }

        if (isLocked) {
            Alert.alert(
                "Screening Locked",
                `To ensure accuracy, the ASD screener can only be taken once every 30 days. Next available: ${nextAvailableDate?.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`
            );
            return;
        }

        if (selectedChild.date_of_birth) {
            const dob = new Date(selectedChild.date_of_birth);
            const today = new Date();
            const ageInMonths = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());

            if (ageInMonths < 18) {
                Alert.alert(
                    "Age Restriction",
                    `This rapid ASD screening is designed for children 18 to 60 months. ${selectedChild.first_name} is currently ${ageInMonths} months old.`
                );
                return;
            }
        }

        setStep('questions');
    };

    const handleAnswer = (questionId: number, value: boolean) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const calculateScore = () => {
        let score = 0;
        QUESTIONS.forEach(q => {
            const answer = answers[q.id];
            if (q.type === 'reverse') {
                // Q1-9: No = 1 point
                if (answer === false) score += 1;
            } else {
                // Q10-13: Yes = 1 point
                if (answer === true) score += 1;
            }
        });
        return score;
    };

    const getRiskLevel = (score: number) => {
        if (score <= 3) return 'Low';
        if (score <= 6) return 'Moderate';
        return 'High';
    };

    const scheduleReminder = async () => {
        try {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                await Notifications.requestPermissionsAsync();
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "ASD Re-assessment Reminder",
                    body: `It's time for ${selectedChild.first_name}'s follow-up ASD screening.`,
                    data: { screen: 'asd-checklist' },
                },
                trigger: {
                    seconds: 30 * 24 * 60 * 60,
                    type: 'timeInterval'
                } as any,
            });
            console.log('Reminder scheduled for 30 days');
        } catch (error) {
            console.error('Failed to schedule notification', error);
        }
    };

    const handleSubmit = async () => {
        const totalScore = calculateScore();
        const risk = getRiskLevel(totalScore);

        try {
            await saveAsdScreening(selectedChild.id, {
                responses: answers,
                score: totalScore,
                riskLevel: risk,
            });

            setResult({ score: totalScore, riskLevel: risk });
            setStep('result');

            if (risk === 'Low') {
                scheduleReminder();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to save screening results.");
        }
    };

    const handleViewHistory = (screening: AsdScreening) => {
        setSelectedHistory(screening);
        setStep('history-detail');
    };

    const renderHistory = () => {
        if (!asdScreenings || asdScreenings.length === 0) return null;

        const riskColors: Record<string, string> = {
            'Low': '#4CAF50',
            'Moderate': '#FF9800',
            'High': '#F44336'
        };

        return (
            <View style={styles.historySection}>
                <View style={styles.historyHeader}>
                    <MaterialIcons name="history" size={20} color={colorScheme.textSecondary} />
                    <Text style={[styles.historyTitle, { color: colorScheme.textSecondary }]}>Previous Screenings</Text>
                </View>
                {(asdScreenings as AsdScreening[]).map((screen) => (
                    <TouchableOpacity
                        key={screen.id}
                        style={[styles.historyCard, { backgroundColor: colorScheme.background, borderColor: colorScheme.border }]}
                        onPress={() => handleViewHistory(screen)}
                    >
                        <View style={styles.historyCardLeft}>
                            <Text style={[styles.historyDate, { color: colorScheme.textPrimary }]}>
                                {new Date(screen.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                            <Text style={[styles.historyScore, { color: colorScheme.textTertiary }]}>
                                Score: {screen.score}/13
                            </Text>
                        </View>
                        <View style={styles.historyBadgeContainer}>
                            <View style={[styles.historyBadge, { backgroundColor: `${riskColors[screen.risk_level]}15` }]}>
                                <Text style={[styles.historyBadgeText, { color: riskColors[screen.risk_level] }]}>
                                    {screen.risk_level} Risk
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={colorScheme.textTertiary} />
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderHistoryDetail = () => {
        if (!selectedHistory) return null;

        const riskColors: Record<string, string> = {
            'Low': '#10B981',
            'Moderate': '#F59E0B',
            'High': '#EF4444'
        };

        const currentRiskColor = riskColors[selectedHistory.risk_level] || '#9CA3AF';

        return (
            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: Spacing.xxl }} showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                    <TouchableOpacity
                        style={styles.backLink}
                        onPress={() => {
                            setStep('intro');
                            setSelectedHistory(null);
                        }}
                    >
                        <MaterialIcons name="arrow-back" size={20} color={VIBRANT.violet[0]} />
                        <Text style={[styles.backLinkText, { color: VIBRANT.violet[0] }]}>Back</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.card, { backgroundColor: colorScheme.surface, marginHorizontal: Spacing.lg, marginBottom: Spacing.xl, padding: 0, overflow: 'hidden' }]}>
                    <View style={[styles.compactResultHeader, { borderBottomColor: colorScheme.border }]}>
                        <View>
                            <Text style={[styles.resultLabelCompact, { color: colorScheme.textTertiary }]}>Historical Record</Text>
                            <Text style={[styles.compactScoreText, { color: colorScheme.textPrimary }]}>
                                Score: <Text style={{ color: VIBRANT.indigo[0], fontWeight: 'bold' }}>{selectedHistory.score} / 13</Text>
                            </Text>
                        </View>
                        <View style={[styles.riskBadge, { backgroundColor: selectedHistory.risk_level === 'Low' ? '#10B981' : (selectedHistory.risk_level === 'Moderate' ? '#F59E0B' : '#EF4444') }]}>
                            <Text style={styles.riskBadgeText}>{selectedHistory.risk_level} Risk</Text>
                        </View>
                    </View>

                    <View style={styles.resultBody}>
                        <Text style={[styles.infoText, { color: colorScheme.textSecondary, marginBottom: Spacing.md }]}>
                            Screened on {new Date(selectedHistory.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                        {(selectedHistory.risk_level === 'High' || selectedHistory.risk_level === 'Moderate') && (
                            <TouchableOpacity
                                style={[styles.gradientButtonWrapper, { marginTop: Spacing.sm }]}
                                onPress={() => setShowSupportModal(true)}
                            >
                                <LinearGradient colors={VIBRANT.indigo} style={[styles.primaryButton, { paddingVertical: Spacing.md }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.sm }}>
                                        <MaterialIcons name="volunteer-activism" size={20} color="#FFF" />
                                        <Text style={styles.primaryButtonText} numberOfLines={1} adjustsFontSizeToFit>Caregiver Support</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.responsesContainer}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary, paddingHorizontal: Spacing.lg }]}>
                        Responses
                    </Text>
                    {QUESTIONS.map((q, idx) => {
                        const answer = selectedHistory.responses[q.id];
                        const isAtRisk = q.type === 'reverse' ? answer === false : answer === true;

                        return (
                            <View
                                key={q.id}
                                style={[
                                    styles.responseCard,
                                    {
                                        backgroundColor: colorScheme.surface,
                                        borderColor: colorScheme.border,
                                        borderLeftWidth: 4,
                                        borderLeftColor: (idx % 2 === 0) ? VIBRANT.violet[0] : VIBRANT.indigo[0]
                                    }
                                ]}
                            >
                                <Text style={[styles.questionText, { color: colorScheme.textPrimary, fontSize: 14 }]}>
                                    {q.id}. {q.text}
                                </Text>
                                <View style={styles.responseValueRow}>
                                    <View style={[
                                        styles.answerBadge,
                                        { backgroundColor: isAtRisk ? `${riskColors.High}15` : `${riskColors.Low}15` }
                                    ]}>
                                        <Text style={[
                                            styles.answerText,
                                            { color: isAtRisk ? riskColors.High : riskColors.Low, fontSize: 12 }
                                        ]}>
                                            {answer ? 'Yes' : 'No'}
                                        </Text>
                                    </View>
                                    {isAtRisk && (
                                        <View style={styles.atRiskIndicator}>
                                            <MaterialIcons name="warning" size={14} color={riskColors.High} />
                                            <Text style={[styles.atRiskLabel, { color: riskColors.High }]}>At Risk</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        );
    };

    const renderIntro = () => (
        <ScrollView contentContainerStyle={styles.centerContent} showsVerticalScrollIndicator={false}>
            <View style={styles.heroContainer}>
                <View style={[styles.heroIconBackdrop, { backgroundColor: `${VIBRANT.violet[0]}15` }]}>
                    <MaterialIcons name="psychology" size={80} color={VIBRANT.violet[0]} />
                </View>
                <Text style={[styles.title, { color: colorScheme.textPrimary }]}>Rapid ASD Screener</Text>
                <Text style={[styles.subtitle, { color: colorScheme.textSecondary }]}>18 - 60 months</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                <View style={[styles.infoBox, { backgroundColor: isDark ? `${VIBRANT.violet[0]}10` : VIBRANT.lavender, borderColor: VIBRANT.lavenderDark, borderWidth: 1 }]}>
                    <MaterialIcons name="info" size={20} color={VIBRANT.violet[0]} style={{ marginBottom: Spacing.xs }} />
                    <Text style={[styles.infoText, { color: colorScheme.textSecondary }]}>
                        This screening tool helps identify possible developmental concerns. It does not provide a diagnosis.
                    </Text>
                </View>

                {isLocked ? (
                    <View style={[styles.lockedCard, { backgroundColor: colorScheme.background, borderColor: colorScheme.border }]}>
                        <MaterialIcons name="lock-clock" size={32} color={colorScheme.textTertiary} />
                        <Text style={[styles.lockedTitle, { color: colorScheme.textPrimary }]}>Next Screening Available In:</Text>
                        <Text style={[styles.lockedCountdown, { color: colorScheme.textPrimary }]}>{daysToGo} Days</Text>
                        <Text style={[styles.lockedDate, { color: colorScheme.textSecondary }]}>
                            {nextAvailableDate?.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.gradientButtonWrapper}
                        onPress={handleStart}
                    >
                        <LinearGradient
                            colors={VIBRANT.violet}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.primaryButton}
                        >
                            <Text style={styles.primaryButtonText}>Start New Screening</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {renderHistory()}
            </View>
        </ScrollView>
    );

    const renderQuestions = () => {
        const allAnswered = QUESTIONS.every(q => answers[q.id] !== undefined);

        return (
            <ScrollView style={styles.scroll}>
                <View style={[styles.detailHeader, { paddingBottom: 0 }]}>
                    <TouchableOpacity
                        style={styles.backLink}
                        onPress={() => setStep('intro')}
                    >
                        <MaterialIcons name="arrow-back" size={20} color={VIBRANT.violet[0]} />
                        <Text style={[styles.backLinkText, { color: VIBRANT.violet[0] }]}>Back</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.questionsContainer}>
                    <View style={styles.questionIntro}>
                        <Text style={[styles.childHeader, { color: VIBRANT.violet[1] }]}>
                            Assessing: {selectedChild?.first_name}
                        </Text>
                        <Text style={[styles.questionHelper, { color: colorScheme.textTertiary }]}>
                            Please answer based on typical behavior, not just a one-time occurrence.
                        </Text>
                    </View>

                    {QUESTIONS.map((q, idx) => (
                        <View
                            key={q.id}
                            style={[
                                styles.questionCard,
                                {
                                    backgroundColor: colorScheme.surface,
                                    borderColor: colorScheme.border,
                                    borderLeftWidth: 6,
                                    borderLeftColor: (idx % 2 === 0) ? VIBRANT.violet[0] : VIBRANT.indigo[0]
                                }
                            ]}
                        >
                            <Text style={[styles.questionText, { color: colorScheme.textPrimary }]}>
                                {q.id}. {q.text}
                            </Text>
                            <View style={styles.buttonGroup}>
                                <TouchableOpacity
                                    style={[
                                        styles.optionButtonPill,
                                        {
                                            backgroundColor: answers[q.id] === true ? colorScheme.success : `${colorScheme.success}20`,
                                            borderColor: answers[q.id] === true ? colorScheme.success : `${colorScheme.success}50`
                                        }
                                    ]}
                                    onPress={() => handleAnswer(q.id, true)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        {
                                            color: answers[q.id] === true ? '#FFF' : colorScheme.success,
                                            fontWeight: answers[q.id] === true ? '700' : '500'
                                        }
                                    ]}>
                                        Yes
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.optionButtonPill,
                                        {
                                            backgroundColor: answers[q.id] === false ? colorScheme.error : `${colorScheme.error}20`,
                                            borderColor: answers[q.id] === false ? colorScheme.error : `${colorScheme.error}50`
                                        }
                                    ]}
                                    onPress={() => handleAnswer(q.id, false)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        {
                                            color: answers[q.id] === false ? '#FFF' : colorScheme.error,
                                            fontWeight: answers[q.id] === false ? '700' : '500'
                                        }
                                    ]}>
                                        No
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.gradientButtonWrapper, { marginTop: Spacing.xl }, !allAnswered && { opacity: 0.5 }]}
                        disabled={!allAnswered || asdLoading}
                        onPress={handleSubmit}
                    >
                        <LinearGradient
                            colors={VIBRANT.violet}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.primaryButton}
                        >
                            {asdLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Submit Screening</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    const renderResult = () => {
        if (!result) return null;

        const riskGradients: Record<string, string[]> = {
            'Low': VIBRANT.emerald,
            'Moderate': VIBRANT.amber,
            'High': ['#F43F5E', '#9333EA'] // Softer Rose to Violet mix
        };

        const currentGradient = riskGradients[result.riskLevel] || VIBRANT.violet;
        const currentRiskColor = result.riskLevel === 'Low' ? '#10B981' : (result.riskLevel === 'Moderate' ? '#F59E0B' : '#E11D48');

        return (
            <ScrollView contentContainerStyle={[styles.centerContent, { paddingBottom: Spacing.xxxl }]}>
                <View style={[styles.card, { backgroundColor: colorScheme.surface, padding: 0, overflow: 'hidden' }]}>
                    <View style={[styles.compactResultHeader, { borderBottomColor: colorScheme.border }]}>
                        <View>
                            <Text style={[styles.resultLabelCompact, { color: colorScheme.textTertiary }]}>Screening Result</Text>
                            <Text style={[styles.compactScoreText, { color: colorScheme.textPrimary }]}>
                                Score: <Text style={{ color: VIBRANT.indigo[0], fontWeight: 'bold' }}>{result.score} / 13</Text>
                            </Text>
                        </View>
                        <View style={[styles.riskBadge, { backgroundColor: result.riskLevel === 'Low' ? '#10B981' : (result.riskLevel === 'Moderate' ? '#F59E0B' : '#EF4444') }]}>
                            <Text style={styles.riskBadgeText}>{result.riskLevel} Risk</Text>
                        </View>
                    </View>

                    <View style={styles.resultBody}>
                        <View style={[styles.interpretationBoxColorful, { backgroundColor: `${currentRiskColor}10`, borderColor: `${currentRiskColor}30` }]}>
                            {result.riskLevel === 'Low' && (
                                <Text style={[styles.interpretationText, { color: colorScheme.textPrimary }]}>
                                    Great! {selectedChild?.first_name} shows a low likelihood of ASD. We've set a reminder to repeat this screening in 30 days.
                                </Text>
                            )}
                            {(result.riskLevel === 'High' || result.riskLevel === 'Moderate') && (
                                <View>
                                    <Text style={[styles.interpretationText, { color: colorScheme.textPrimary, marginBottom: Spacing.md }]}>
                                        {result.riskLevel === 'High' 
                                            ? `${selectedChild?.first_name}'s score indicates a high risk. We strongly recommend a professional assessment.`
                                            : `${selectedChild?.first_name}'s score indicates a moderate risk. We recommend close monitoring and repeating the assessment in 4-6 weeks.`
                                        }
                                    </Text>
                                    
                                    {result.riskLevel === 'High' && (
                                        <TouchableOpacity
                                            style={[styles.gradientButtonWrapper, { marginBottom: Spacing.md }]}
                                            onPress={() => router.push('/(tabs)/appointments')}
                                        >
                                            <LinearGradient colors={VIBRANT.indigo} style={styles.primaryButton}>
                                                <Text style={styles.primaryButtonText} numberOfLines={1} adjustsFontSizeToFit>Book Consultation</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={styles.gradientButtonWrapper}
                                        onPress={() => setShowSupportModal(true)}
                                    >
                                        <LinearGradient colors={['#9333EA', '#7E22CE']} style={styles.primaryButton}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.sm }}>
                                                <MaterialIcons name="volunteer-activism" size={20} color="#FFF" />
                                                <Text style={styles.primaryButtonText} numberOfLines={1} adjustsFontSizeToFit>Caregiver Support</Text>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <Text style={[styles.disclaimerTextJustified, { color: colorScheme.textTertiary }]}>
                            “This tool helps identify possible developmental concerns. It does not provide a diagnosis. Please consult a qualified professional for a full assessment.”
                        </Text>

                        {!isLocked && (
                            <TouchableOpacity
                                style={[styles.textButton, { marginTop: Spacing.md }]}
                                onPress={() => {
                                    setStep('intro');
                                    setAnswers({});
                                }}
                            >
                                <Text style={{ color: VIBRANT.violet[0], fontWeight: 'bold' }}>Retake Screening</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderSupportModal = () => (
        <Modal
            visible={showSupportModal}
            animationType="slide"
            transparent={false}
            onRequestClose={() => {
                if (selectedCategory) setSelectedCategory(null);
                else setShowSupportModal(false);
            }}
        >
            <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
                <View style={[styles.modalHeader, { 
                    backgroundColor: isDark ? VIBRANT.violet[0] : colorScheme.primary, 
                    paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : Spacing.md),
                }]}>
                    <TouchableOpacity 
                        onPress={() => {
                            if (selectedCategory) setSelectedCategory(null);
                            else setShowSupportModal(false);
                        }}
                        style={styles.modalCloseBtn}
                    >
                        <MaterialIcons name={selectedCategory ? "arrow-back" : "close"} size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={[styles.modalHeaderText, { color: '#FFFFFF' }]}>
                        {selectedCategory ? selectedCategory.title : SUPPORT_HEADER.title}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: Spacing.xxxl }}>
                    {!selectedCategory ? (
                        <View style={{ padding: Spacing.lg }}>
                            <View style={[styles.supportIntroCard, { backgroundColor: colorScheme.surface }]}>
                                <Text style={[styles.supportIntroTitle, { color: colorScheme.textPrimary }]}>
                                    {SUPPORT_HEADER.subtitle}
                                </Text>
                                <View style={styles.reminderGrid}>
                                    {SUPPORT_HEADER.reminders.map((r, i) => (
                                        <View key={i} style={styles.reminderItem}>
                                            <MaterialIcons name="check-circle" size={16} color={VIBRANT.emerald[0]} />
                                            <Text style={[styles.reminderText, { color: colorScheme.textSecondary }]}>{r}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.categoryGrid}>
                                {SUPPORT_ACTIVITIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.categoryCard, { backgroundColor: colorScheme.surface }]}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        <View style={[styles.categoryIconCircle, { backgroundColor: `${cat.color}15` }]}>
                                            <MaterialIcons name={cat.icon as any} size={28} color={cat.color} />
                                        </View>
                                        <Text 
                                            style={[styles.categoryCardTitle, { color: colorScheme.textPrimary }]}
                                            numberOfLines={2}
                                            adjustsFontSizeToFit
                                        >
                                            {cat.title}
                                        </Text>
                                        <Text style={[styles.categoryCardCount, { color: colorScheme.textTertiary }]}>{cat.tips.length} Tips</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={[styles.supportFooter, { backgroundColor: `${VIBRANT.indigo[0]}10` }]}>
                                <Text style={[styles.supportFooterText, { color: colorScheme.textPrimary }]}>
                                    {SUPPORT_HEADER.closing}
                                </Text>
                                <Text style={[styles.supportContact, { color: VIBRANT.indigo[0] }]}>
                                    {SUPPORT_HEADER.footer}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={{ padding: Spacing.lg }}>
                            <View style={[styles.categoryHeader, { borderLeftColor: selectedCategory.color }]}>
                                <MaterialIcons name={selectedCategory.icon as any} size={32} color={selectedCategory.color} />
                                <View>
                                    <Text style={[styles.categoryDetailTitle, { color: colorScheme.textPrimary }]}>{selectedCategory.title}</Text>
                                </View>
                            </View>

                            {selectedCategory.tips.map((tip: any, idx: number) => (
                                <View key={idx} style={[styles.tipCard, { backgroundColor: colorScheme.surface }]}>
                                    <View style={[styles.tipNumber, { backgroundColor: selectedCategory.color }]}>
                                        <Text style={styles.tipNumberText}>{idx + 1}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.tipDetailText, { color: colorScheme.textPrimary }]}>{tip.text}</Text>
                                    </View>
                                </View>
                            ))}

                            <TouchableOpacity 
                                style={[styles.backToGridBtn, { borderColor: selectedCategory.color }]}
                                onPress={() => setSelectedCategory(null)}
                            >
                                <Text style={[styles.backToGridText, { color: selectedCategory.color }]}>View All Categories</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="ASD Screener" showMenu={true} />
            {step === 'intro' && renderIntro()}
            {step === 'questions' && renderQuestions()}
            {step === 'result' && renderResult()}
            {step === 'history-detail' && renderHistoryDetail()}
            {renderSupportModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    centerContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    card: {
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        ...Shadow.md,
    },
    title: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: 'bold',
        marginTop: Spacing.lg,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.fontSize.md,
        marginTop: Spacing.xs,
        marginBottom: Spacing.xl,
        textAlign: 'center',
        opacity: 0.8,
    },
    heroContainer: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    heroIconBackdrop: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    infoBox: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xl,
        width: '100%',
        alignItems: 'center',
    },
    infoText: {
        fontSize: Typography.fontSize.sm,
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    questionIntro: {
        marginBottom: Spacing.xl,
        alignItems: 'center',
    },
    questionHelper: {
        fontSize: Typography.fontSize.xs,
        textAlign: 'center',
        marginTop: 4,
    },
    childHeader: {
        fontSize: Typography.fontSize.lg,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    questionsContainer: {
        padding: Spacing.lg,
    },
    questionCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.lg,
        ...Shadow.sm,
    },
    questionText: {
        fontSize: Typography.fontSize.md,
        lineHeight: 22,
        fontWeight: '500',
        marginBottom: Spacing.lg,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    optionButtonPill: {
        flex: 1,
        paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    optionText: {
        fontSize: Typography.fontSize.sm,
    },
    gradientButtonWrapper: {
        width: '100%',
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        ...Shadow.md,
    },
    primaryButton: {
        width: '100%',
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: Typography.fontSize.md,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    compactResultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    resultLabelCompact: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '700',
        marginBottom: 2,
    },
    compactScoreText: {
        fontSize: Typography.fontSize.lg,
        fontWeight: '600',
    },
    riskBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
    },
    riskBadgeText: {
        color: '#FFF',
        fontSize: Typography.fontSize.xs,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    resultBody: {
        padding: Spacing.lg,
        alignItems: 'center',
    },
    interpretationBoxColorful: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.xl,
        width: '100%',
    },
    interpretationText: {
        fontSize: Typography.fontSize.base,
        lineHeight: 24,
        textAlign: 'center',
    },
    disclaimerTextJustified: {
        fontSize: Typography.fontSize.xs,
        textAlign: 'center',
        lineHeight: 18,
        fontStyle: 'italic',
        marginTop: Spacing.lg,
    },
    riskLevel: {
        fontSize: Typography.fontSize.xl,
        fontWeight: 'bold',
        marginBottom: Spacing.xl,
    },
    interpretationBox: {
        width: '100%',
        marginBottom: Spacing.xl,
    },
    disclaimerText: {
        fontSize: 10,
        color: '#9CA3AF',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: Spacing.xl,
    },
    bookButton: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    textButton: {
        padding: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: 'bold',
        marginBottom: Spacing.md,
    },
    historySection: {
        width: '100%',
        marginTop: Spacing.xl,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: Spacing.lg,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    historyTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    historyCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    historyCardLeft: {
        gap: 2,
    },
    historyDate: {
        fontSize: Typography.fontSize.md,
        fontWeight: '600',
    },
    historyScore: {
        fontSize: Typography.fontSize.xs,
    },
    historyBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    historyBadgeText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: 'bold',
    },
    historyBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    detailHeader: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        marginBottom: Spacing.md,
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    backLinkText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: 'bold',
    },
    responsesContainer: {
        marginBottom: Spacing.md,
    },
    responseCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    responseValueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    answerBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        borderRadius: BorderRadius.md,
    },
    answerText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: 'bold',
    },
    atRiskIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    atRiskLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    lockedCard: {
        width: '100%',
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        marginVertical: Spacing.md,
    },
    lockedTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: '600',
        marginTop: Spacing.sm,
    },
    lockedCountdown: {
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: Spacing.xs,
    },
    lockedDate: {
        fontSize: Typography.fontSize.xs,
        fontWeight: '500',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        justifyContent: 'space-between',
    },
    modalHeaderText: {
        color: '#FFF',
        fontSize: Typography.fontSize.lg,
        fontWeight: 'bold',
    },
    modalCloseBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    supportIntroCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.lg,
        ...Shadow.sm,
    },
    supportIntroTitle: {
        fontSize: Typography.fontSize.md,
        lineHeight: 22,
        fontWeight: '500',
        marginBottom: Spacing.md,
    },
    reminderGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    reminderItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        width: '48%',
    },
    reminderText: {
        fontSize: Typography.fontSize.xs,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    categoryCard: {
        width: '47%',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        marginBottom: Spacing.sm,
        ...Shadow.sm,
    },
    categoryIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    categoryCardTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 2,
    },
    categoryCardCount: {
        fontSize: 10,
        fontWeight: '500',
    },
    supportFooter: {
        marginTop: Spacing.xl,
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    supportFooterText: {
        fontSize: Typography.fontSize.sm,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: Spacing.md,
    },
    supportContact: {
        fontSize: Typography.fontSize.sm,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.lg,
        borderLeftWidth: 4,
        paddingLeft: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    categoryDetailTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: 'bold',
    },
    tipCard: {
        flexDirection: 'row',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
        alignItems: 'center',
        gap: Spacing.lg,
        ...Shadow.sm,
    },
    tipNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipNumberText: {
        color: '#FFF',
        fontSize: Typography.fontSize.xs,
        fontWeight: 'bold',
    },
    tipDetailText: {
        flex: 1,
        fontSize: Typography.fontSize.md,
        lineHeight: 22,
    },
    backToGridBtn: {
        marginTop: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
    },
    backToGridText: {
        fontWeight: 'bold',
    },
});
