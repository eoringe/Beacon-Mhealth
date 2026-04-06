import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Image,
    Easing,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { sendMessageToBeaconAI } from '@/services/beaconAiService';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

// ── Contextual thinking indicators ─────────────────────────────────────────
const THINKING_PHRASES = [
    'Looking that up for you…',
    'Let me check Beacon\'s knowledge…',
    'Getting your answer ready…',
    'Searching through our information…',
    'Almost there, just a moment…',
    'Connecting with Beacon\'s services…',
    'Preparing the best answer for you…',
    'Reviewing what I know about this…',
];

// ── Suggested quick questions ────────────────────────────────────────────────
const QUICK_QUESTIONS = [
    'What services does Beacon offer?',
    'Where is Beacon located?',
    'What are Beacon\'s operating hours?',
    'How do I book an appointment in the app?',
    'What is ASD and how does Beacon help?',
    'How do I track my child\'s growth?',
];

// ── Thinking Indicator Component ─────────────────────────────────────────────
function ThinkingIndicator({ colorScheme }) {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
    const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
    const dotOpacity3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        // Cycle through phrases
        const phraseTimer = setInterval(() => {
            setPhraseIndex(prev => (prev + 1) % THINKING_PHRASES.length);
        }, 1800);

        // Animate dots
        const animateDots = () => {
            const seq = (dot, delay) =>
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.ease }),
                    Animated.timing(dot, { toValue: 0.3, duration: 350, useNativeDriver: true, easing: Easing.ease }),
                ]);

            Animated.loop(
                Animated.parallel([
                    seq(dotOpacity1, 0),
                    seq(dotOpacity2, 200),
                    seq(dotOpacity3, 400),
                ])
            ).start();
        };
        animateDots();

        return () => clearInterval(phraseTimer);
    }, []);

    return (
        <View style={[styles.thinkingBubble, { backgroundColor: colorScheme.surface }]}>
            <View style={styles.thinkingDots}>
                <Animated.View style={[styles.dot, { opacity: dotOpacity1, backgroundColor: colorScheme.primary }]} />
                <Animated.View style={[styles.dot, { opacity: dotOpacity2, backgroundColor: colorScheme.primary }]} />
                <Animated.View style={[styles.dot, { opacity: dotOpacity3, backgroundColor: colorScheme.primary }]} />
            </View>
            <Text style={[styles.thinkingText, { color: colorScheme.textSecondary }]}>
                {THINKING_PHRASES[phraseIndex]}
            </Text>
        </View>
    );
}

// ── Message Bubble Component ─────────────────────────────────────────────────
function MessageBubble({ message, colorScheme, isDark }) {
    const isUser = message.role === 'user';
    const scaleAnim = useRef(new Animated.Value(0.88)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowAI,
                { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
            ]}
        >
            {!isUser && (
                <View style={styles.aiAvatarSmall}>
                    <Image
                        source={require('../../assets/images/beacon.png')}
                        style={styles.aiAvatarImage}
                        resizeMode="contain"
                    />
                    <View style={styles.onlineDotSmall} />
                </View>
            )}
            <View
                style={[
                    styles.bubble,
                    isUser
                        ? [styles.userBubble, { backgroundColor: colorScheme.primary }]
                        : [styles.aiBubble, { backgroundColor: isDark ? colorScheme.surface : '#FFFFFF', ...Shadow.sm }],
                ]}
            >
                <Text
                    style={[
                        styles.bubbleText,
                        { color: isUser ? '#FFFFFF' : colorScheme.textPrimary },
                    ]}
                >
                    {message.content}
                </Text>
                <Text
                    style={[
                        styles.bubbleTime,
                        { color: isUser ? 'rgba(255,255,255,0.65)' : colorScheme.textTertiary },
                    ]}
                >
                    {message.time}
                </Text>
            </View>
        </Animated.View>
    );
}

// ── Quick Question Pill ───────────────────────────────────────────────────────
function QuickPill({ label, onPress, colorScheme }) {
    return (
        <TouchableOpacity
            onPress={() => onPress(label)}
            style={[styles.quickPill, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border }]}
            activeOpacity={0.75}
        >
            <Text style={[styles.quickPillText, { color: colorScheme.primary }]} numberOfLines={1}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

// ── Main Chat Screen ──────────────────────────────────────────────────────────
export default function BeaconAIScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme, isDark } = useTheme();

    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! 👋 I'm the Beacon AI Assistant. I'm here to answer your questions about Beacon Children's Centre and the Beacon Mhealth app.\n\nHow can I help you today?",
            time: formatTime(new Date()),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickQuestions, setShowQuickQuestions] = useState(true);

    const flatListRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, []);

    const handleSend = useCallback(async (text) => {
        const trimmed = (text || inputText).trim();
        if (!trimmed || isLoading) return;

        setInputText('');
        setShowQuickQuestions(false);
        setIsLoading(true);

        const userMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: trimmed,
            time: formatTime(new Date()),
        };

        setMessages(prev => [...prev, userMessage]);
        scrollToBottom();

        // Build conversation history for API (excluding welcome message)
        const history = [...messages, userMessage]
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role, content: m.content }));

        try {
            const reply = await sendMessageToBeaconAI(history);
            const aiMessage = {
                id: `ai_${Date.now()}`,
                role: 'assistant',
                content: reply,
                time: formatTime(new Date()),
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errMessage = {
                id: `err_${Date.now()}`,
                role: 'assistant',
                content: "I'm sorry, I couldn't connect right now. Please check your internet connection and try again, or contact Beacon directly at +254 115 188 415 / +254 780 626 990.",
                time: formatTime(new Date()),
            };
            setMessages(prev => [...prev, errMessage]);
        } finally {
            setIsLoading(false);
            scrollToBottom();
        }
    }, [inputText, isLoading, messages, scrollToBottom]);

    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const renderItem = useCallback(({ item }) => (
        <MessageBubble message={item} colorScheme={colorScheme} isDark={isDark} />
    ), [colorScheme, isDark]);

    const canSend = inputText.trim().length > 0 && !isLoading;

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            {/* ── Header ── */}
            <View style={[styles.header, {
                backgroundColor: isDark ? colorScheme.surface : colorScheme.primary,
                paddingTop: insets.top + Spacing.sm,
            }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {/* AI Avatar */}
                <View style={styles.headerCenter}>
                    <View style={styles.headerAvatarWrapper}>
                        <Image
                            source={require('../../assets/images/beacon.png')}
                            style={styles.headerAvatar}
                            resizeMode="contain"
                        />
                        <View style={styles.onlineDot} />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>Beacon Assistant</Text>
                        <View style={styles.onlineStatusRow}>
                            <View style={styles.onlineDotInline} />
                            <Text style={styles.headerSub}>Always online</Text>
                        </View>
                    </View>
                </View>

                <View style={{ width: 40 }} />
            </View>

            {/* ── Message List ── */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[
                        styles.messageList,
                        { paddingBottom: Spacing.lg },
                    ]}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={scrollToBottom}
                    ListFooterComponent={
                        <>
                            {isLoading && <ThinkingIndicator colorScheme={colorScheme} />}
                            {showQuickQuestions && !isLoading && (
                                <View style={styles.quickSection}>
                                    <Text style={[styles.quickLabel, { color: colorScheme.textTertiary }]}>
                                        Suggested questions
                                    </Text>
                                    <View style={styles.quickGrid}>
                                        {QUICK_QUESTIONS.map((q) => (
                                            <QuickPill
                                                key={q}
                                                label={q}
                                                onPress={handleSend}
                                                colorScheme={colorScheme}
                                            />
                                        ))}
                                    </View>
                                </View>
                            )}
                        </>
                    }
                />

                {/* ── Input Bar ── */}
                <View style={[
                    styles.inputBar,
                    {
                        backgroundColor: isDark ? colorScheme.surface : '#FFFFFF',
                        borderTopColor: colorScheme.border,
                        paddingBottom: insets.bottom + Spacing.sm,
                    }
                ]}>
                    <View style={[styles.inputWrapper, {
                        backgroundColor: isDark ? colorScheme.background : '#F5F7FF',
                        borderColor: colorScheme.border,
                    }]}>
                        <TextInput
                            ref={inputRef}
                            style={[styles.textInput, { color: colorScheme.textPrimary }]}
                            placeholder="Ask me anything about Beacon…"
                            placeholderTextColor={colorScheme.textTertiary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            returnKeyType="send"
                            onSubmitEditing={() => handleSend()}
                            blurOnSubmit={false}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={() => handleSend()}
                        disabled={!canSend}
                        style={[
                            styles.sendButton,
                            {
                                backgroundColor: canSend ? colorScheme.primary : colorScheme.border,
                            },
                        ]}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <MaterialIcons name="send" size={20} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    headerAvatarWrapper: {
        position: 'relative',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    headerInfo: {
        alignItems: 'flex-start',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
    },
    onlineStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 1,
    },
    onlineDotInline: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#22C55E',
    },
    headerSub: {
        color: 'rgba(255,255,255,0.80)',
        fontSize: Typography.fontSize.xs,
    },

    // Messages
    messageList: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.lg,
    },
    messageRow: {
        marginBottom: Spacing.sm,
        maxWidth: '85%',
    },
    messageRowUser: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    messageRowAI: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: Spacing.xs,
    },
    aiAvatarSmall: {
        position: 'relative',
        width: 30,
        height: 30,
        marginBottom: 4,
    },
    aiAvatarImage: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
    },
    onlineDotSmall: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22C55E',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    bubble: {
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        maxWidth: '100%',
    },
    userBubble: {
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        borderBottomLeftRadius: 4,
    },
    bubbleText: {
        fontSize: Typography.fontSize.base,
        lineHeight: 22,
    },
    bubbleTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },

    // Thinking
    thinkingBubble: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        borderRadius: BorderRadius.xl,
        borderBottomLeftRadius: 4,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        marginTop: Spacing.xs,
        ...Shadow.sm,
    },
    thinkingDots: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center',
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    thinkingText: {
        fontSize: Typography.fontSize.sm,
        fontStyle: 'italic',
        flexShrink: 1,
    },

    // Quick Questions
    quickSection: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    quickLabel: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.sm,
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    quickPill: {
        borderWidth: 1,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        ...Shadow.sm,
    },
    quickPillText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },

    // Input Bar
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        gap: Spacing.sm,
    },
    inputWrapper: {
        flex: 1,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 2,
        maxHeight: 120,
        justifyContent: 'center',
    },
    textInput: {
        fontSize: Typography.fontSize.base,
        lineHeight: 22,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.sm,
    },
});
