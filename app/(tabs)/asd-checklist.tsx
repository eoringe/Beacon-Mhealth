import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow, Colors } from '@/constants/theme';

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

    useEffect(() => {
        if (selectedChild?.id) {
            refreshAsdScreenings(selectedChild.id);
        }
    }, [selectedChild]);
    
    const handleStart = () => {
        if (!selectedChild) {
            Alert.alert("Child Required", "Please select a child from the dashboard first.");
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
            'Low': '#4CAF50',
            'Moderate': '#FF9800',
            'High': '#F44336'
        };

        const currentRiskColor = riskColors[selectedHistory.risk_level] || '#9CA3AF';

        return (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                    <TouchableOpacity 
                        style={styles.backLink}
                        onPress={() => {
                            setStep('intro');
                            setSelectedHistory(null);
                        }}
                    >
                        <MaterialIcons name="arrow-back" size={20} color={colorScheme.primary} />
                        <Text style={[styles.backLinkText, { color: colorScheme.primary }]}>Back to History</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.card, { backgroundColor: colorScheme.surface, marginHorizontal: Spacing.lg, marginBottom: Spacing.xl }]}>
                    <Text style={[styles.resultLabel, { color: colorScheme.textSecondary }]}>
                        Screened: {new Date(selectedHistory.created_at).toLocaleDateString(undefined, { 
                            day: 'numeric', month: 'long', year: 'numeric',
                            hour: 'numeric', minute: '2-digit'
                        })}
                    </Text>
                    <View style={[styles.scoreCircle, { borderColor: currentRiskColor }]}>
                        <Text style={[styles.scoreValue, { color: currentRiskColor }]}>{selectedHistory.score}</Text>
                        <Text style={[styles.scoreMax, { color: colorScheme.textTertiary }]}>/ 13</Text>
                    </View>
                    <Text style={[styles.riskLevel, { color: currentRiskColor }]}>{selectedHistory.risk_level} Risk</Text>
                </View>

                <View style={styles.responsesContainer}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary, paddingHorizontal: Spacing.lg }]}>
                        Your Responses
                    </Text>
                    {QUESTIONS.map((q) => {
                        const answer = selectedHistory.responses[q.id];
                        const isAtRisk = q.type === 'reverse' ? answer === false : answer === true;

                        return (
                            <View key={q.id} style={[styles.responseCard, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border }]}>
                                <Text style={[styles.questionText, { color: colorScheme.textPrimary }]}>
                                    {q.id}. {q.text}
                                </Text>
                                <View style={styles.responseValueRow}>
                                    <View style={[
                                        styles.answerBadge, 
                                        { backgroundColor: isAtRisk ? `${riskColors.High}15` : `${riskColors.Low}15` }
                                    ]}>
                                        <Text style={[
                                            styles.answerText, 
                                            { color: isAtRisk ? riskColors.High : riskColors.Low }
                                        ]}>
                                            {answer ? 'Yes' : 'No'}
                                        </Text>
                                    </View>
                                    {isAtRisk && (
                                        <View style={styles.atRiskIndicator}>
                                            <MaterialIcons name="warning" size={14} color={riskColors.High} />
                                            <Text style={[styles.atRiskLabel, { color: riskColors.High }]}>At Risk Answer</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                <TouchableOpacity 
                    style={[styles.primaryButton, { backgroundColor: colorScheme.primary, margin: Spacing.lg }]}
                    onPress={() => {
                        setStep('intro');
                        setSelectedHistory(null);
                        handleStart();
                    }}
                >
                    <Text style={styles.primaryButtonText}>Retake Assessment</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    const renderIntro = () => (
        <ScrollView contentContainerStyle={styles.centerContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                <MaterialIcons name="psychology" size={64} color={colorScheme.primary} />
                <Text style={[styles.title, { color: colorScheme.textPrimary }]}>Rapid ASD Checklist</Text>
                <Text style={[styles.subtitle, { color: colorScheme.textSecondary }]}>For children 18 months - 60 months</Text>
                
                <View style={styles.infoBox}>
                    <Text style={[styles.infoText, { color: colorScheme.textSecondary }]}>
                        This screening tool helps identify possible developmental concerns. It does not provide a diagnosis.
                    </Text>
                </View>

                <TouchableOpacity 
                    style={[styles.primaryButton, { backgroundColor: colorScheme.primary }]}
                    onPress={handleStart}
                >
                    <Text style={styles.primaryButtonText}>Start New Assessment</Text>
                </TouchableOpacity>

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
                        <MaterialIcons name="arrow-back" size={20} color={colorScheme.primary} />
                        <Text style={[styles.backLinkText, { color: colorScheme.primary }]}>Back to History</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.questionsContainer}>
                    <Text style={[styles.childHeader, { color: colorScheme.primary }]}>
                        Assessing: {selectedChild?.first_name}
                    </Text>
                    {QUESTIONS.map((q) => (
                        <View key={q.id} style={[styles.questionCard, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border }]}>
                            <Text style={[styles.questionText, { color: colorScheme.textPrimary }]}>
                                {q.id}. {q.text}
                            </Text>
                            <View style={styles.buttonGroup}>
                                <TouchableOpacity
                                    style={[
                                        styles.optionButton,
                                        answers[q.id] === true && { backgroundColor: colorScheme.primary, borderColor: colorScheme.primary }
                                    ]}
                                    onPress={() => handleAnswer(q.id, true)}
                                >
                                    <Text style={[styles.optionText, answers[q.id] === true && { color: '#FFF' }]}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.optionButton,
                                        answers[q.id] === false && { backgroundColor: colorScheme.primary, borderColor: colorScheme.primary }
                                    ]}
                                    onPress={() => handleAnswer(q.id, false)}
                                >
                                    <Text style={[styles.optionText, answers[q.id] === false && { color: '#FFF' }]}>No</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity 
                        style={[
                            styles.primaryButton, 
                            { backgroundColor: colorScheme.primary, marginTop: Spacing.xl },
                            !allAnswered && { opacity: 0.5 }
                        ]}
                        disabled={!allAnswered || asdLoading}
                        onPress={handleSubmit}
                    >
                        {asdLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Submit Assessment</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    const renderResult = () => {
        const riskColors: Record<string, string> = {
            'Low': '#4CAF50',
            'Moderate': '#FF9800',
            'High': '#F44336'
        };

        if (!result) return null;

        const currentRiskColor = riskColors[result.riskLevel] || '#9CA3AF';

        return (
            <ScrollView contentContainerStyle={styles.centerContent}>
                <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                    <Text style={[styles.resultLabel, { color: colorScheme.textSecondary }]}>Screening Result</Text>
                    <View style={[styles.scoreCircle, { borderColor: currentRiskColor }]}>
                        <Text style={[styles.scoreValue, { color: currentRiskColor }]}>{result.score}</Text>
                        <Text style={[styles.scoreMax, { color: colorScheme.textTertiary }]}>/ 13</Text>
                    </View>
                    <Text style={[styles.riskLevel, { color: currentRiskColor }]}>{result.riskLevel} Risk</Text>
                    
                    <View style={styles.interpretationBox}>
                        {result.riskLevel === 'Low' && (
                            <Text style={[styles.interpretationText, { color: colorScheme.textPrimary }]}>
                                Low likelihood. Please monitor and repeat the assessment in 30 days. We've set a reminder for you.
                            </Text>
                        )}
                        {result.riskLevel === 'Moderate' && (
                            <Text style={[styles.interpretationText, { color: colorScheme.textPrimary }]}>
                                Moderate risk. Monitor your child's progress closely and repeat the assessment in 4-6 weeks.
                            </Text>
                        )}
                        {result.riskLevel === 'High' && (
                            <View>
                                <Text style={[styles.interpretationText, { color: colorScheme.textPrimary, marginBottom: Spacing.md }]}>
                                    High risk. We recommend further professional assessment by a specialist.
                                </Text>
                                <TouchableOpacity 
                                    style={[styles.bookButton, { backgroundColor: colorScheme.primary }]}
                                    onPress={() => router.push('/(tabs)/appointments')}
                                >
                                    <Text style={styles.bookButtonText}>Book an Appointment</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <Text style={styles.disclaimerText}>
                        “This tool helps identify possible developmental concerns. It does not provide a diagnosis. Please consult a qualified professional for a full assessment.”
                    </Text>

                    <TouchableOpacity 
                        style={styles.textButton}
                        onPress={() => {
                            setStep('intro');
                            setAnswers({});
                        }}
                    >
                        <Text style={{ color: colorScheme.primary }}>Retake Assessment</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="ASD Screening" />
            {step === 'intro' && renderIntro()}
            {step === 'questions' && renderQuestions()}
            {step === 'result' && renderResult()}
            {step === 'history-detail' && renderHistoryDetail()}
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
        fontSize: Typography.fontSize.xl,
        fontWeight: 'bold',
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.xs,
        marginBottom: Spacing.xl,
    },
    infoBox: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.xl,
    },
    infoText: {
        fontSize: Typography.fontSize.sm,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    childHeader: {
        fontSize: Typography.fontSize.md,
        fontWeight: '700',
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    questionsContainer: {
        padding: Spacing.lg,
    },
    questionCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    questionText: {
        fontSize: Typography.fontSize.base,
        lineHeight: 22,
        marginBottom: Spacing.md,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    optionButton: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    optionText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: '600',
    },
    primaryButton: {
        width: '100%',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: Typography.fontSize.md,
        fontWeight: 'bold',
    },
    resultLabel: {
        fontSize: Typography.fontSize.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.lg,
    },
    scoreCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    scoreValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    scoreMax: {
        fontSize: Typography.fontSize.xs,
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
    interpretationText: {
        fontSize: Typography.fontSize.base,
        lineHeight: 24,
        textAlign: 'center',
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
});
