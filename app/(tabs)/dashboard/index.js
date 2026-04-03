import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert,
    Animated,
    Easing,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAlert } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChild } from '@/contexts/ChildContext';
import { useDrawer } from '@/contexts/DrawerContext';
import appointmentService from '@/services/appointmentService';
import { milestoneService } from '@/services/milestoneService';
import { getDailyPick } from '@/constants/activitiesData';
import { calculateAgeInMonths, getMilestonesForAge, MILESTONE_AGES } from '@/constants/milestones';
import { getVaccinationStatus } from '@/constants/vaccinationSchedule';
import { Spacing, Typography, BorderRadius, Shadow, Colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

// ─── Feature Discovery Slides ───
const FEATURE_SLIDES = [
    { id: 'track', icon: 'show-chart', title: 'Track Growth', desc: 'Monitor height & weight charts', color: '#2196F3', route: '/dashboard/growth-chart' },
    { id: 'vaccine', icon: 'vaccines', title: 'Vaccination Schedule', desc: 'Never miss an immunization date', color: '#4CAF50', route: '/dashboard/vaccinations' },
    { id: 'appt', icon: 'calendar-today', title: 'Book Appointments', desc: 'Schedule doctor visits in seconds', color: '#FF9800', route: '/(tabs)/appointments' },
    { id: 'miles', icon: 'checklist', title: 'Milestone Checker', desc: 'Track developmental milestones by age', color: '#9C27B0', route: '/dashboard/milestone-checklist' },
    { id: 'feed', icon: 'restaurant', title: 'Feeding Tracker', desc: 'Log breastfeeding, bottles & solids', color: '#E91E63', route: '/dashboard/feeding' },
    { id: 'sleep', icon: 'bedtime', title: 'Sleep Tracker', desc: 'Track naps and nighttime sleep', color: '#5C6BC0', route: '/dashboard/sleep' },
];

// ─── Smooth Crossfade Carousel Component ───
function SmoothCarousel({ data, renderCard, autoScrollMs = 15000, cardHeight = 140 }) {
    const { colorScheme, isDark } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (data.length <= 1) return;
        const timer = setInterval(() => {
            // Fade out + slide left
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 0, duration: 400, easing: Easing.ease, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: -30, duration: 400, easing: Easing.ease, useNativeDriver: true }),
            ]).start(() => {
                setActiveIndex(prev => (prev + 1) % data.length);
                slideAnim.setValue(30); // Reset to right
                // Fade in + slide from right
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.ease, useNativeDriver: true }),
                    Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.ease, useNativeDriver: true }),
                ]).start();
            });
        }, autoScrollMs);
        return () => clearInterval(timer);
    }, [data.length, autoScrollMs]);

    if (data.length === 0) return null;

    return (
        <View>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }], minHeight: cardHeight, width: '100%' }}>
                {renderCard(data[activeIndex], activeIndex)}
            </Animated.View>
            {data.length > 1 && (
                <View style={carouselStyles.dotsRow}>
                    {data.map((_, i) => (
                        <View key={i} style={[carouselStyles.dot, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : '#D1D5DB' }, i === activeIndex && [carouselStyles.dotActive, { backgroundColor: colorScheme.primary }]]} />
                    ))}
                </View>
            )}
        </View>
    );
}

const carouselStyles = StyleSheet.create({
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 0 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D1D5DB' },
    dotActive: { width: 18 }, // backgroundColor will be applied dynamically
});

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme, isDark } = useTheme();
    const { showAlert } = useAlert();
    const { user } = useAuth();
    const { selectedChild, asdScreenings } = useChild();
    const { notifications, clearAll } = useNotifications();
    const { openDrawer } = useDrawer();

    // State
    const [milestoneConcern, setMilestoneConcern] = useState(false);
    const [milestoneAlertDismissed, setMilestoneAlertDismissed] = useState(false);

    // ASD Screening Logic
    const latestAsdScreening = asdScreenings && asdScreenings.length > 0 ? asdScreenings[0] : null;
    const isAsdDue = latestAsdScreening && 
                    latestAsdScreening.risk_level === 'Low' && 
                    (new Date() - new Date(latestAsdScreening.created_at)) > (30 * 24 * 60 * 60 * 1000);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [milestoneProgress, setMilestoneProgress] = useState(null);
    const [vaccineActionNeeded, setVaccineActionNeeded] = useState(false);

    // Tracker Stats for Dynamic Insights
    const [trackerStats, setTrackerStats] = useState({
        feedingToday: 0,
        sleepToday: 0,
        teethingCount: 0,
        firstsCount: 0,
    });

    const recentActivity = useMemo(() => {
        const seen = new Set();
        return (notifications || []).filter(n => {
            if (seen.has(n.category)) return false;
            seen.add(n.category);
            return true;
        }).slice(0, 3);
    }, [notifications]);

    // Time-of-day greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Calculate age display
    const calculateAge = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age === 0) {
            const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
            return `${months} mo`;
        }
        return `${age} yr`;
    };

    const ageInMonths = selectedChild?.date_of_birth ? calculateAgeInMonths(selectedChild.date_of_birth) : null;

    // Insight slides based on child's age and data
    const getInsightSlides = () => {
        if (ageInMonths == null) return [];
        const name = selectedChild.first_name;
        const slides = [];

        // 1. Age-based development tip
        const ageTips = [
            { max: 3, icon: '👶', title: 'Newborn Phase', tip: `${name} is discovering the world! Lots of tummy time helps build neck strength.`, bg: '#6C63FF' },
            { max: 6, icon: '🍼', title: 'Growing Fast', tip: `${name} may start reaching for toys and rolling over soon.`, bg: '#2196F3' },
            { max: 9, icon: '🧸', title: 'Explorer Mode', tip: `${name} might be sitting up and babbling. Read together!`, bg: '#00897B' },
            { max: 12, icon: '🎉', title: 'Almost One!', tip: `${name} may start standing or saying first words!`, bg: '#F4511E' },
            { max: 18, icon: '🚶', title: 'On the Move', tip: `${name} is becoming more independent every day.`, bg: '#6D4C41' },
            { max: 24, icon: '🗣️', title: 'Talking Time', tip: `${name}'s vocabulary is growing. Name everything!`, bg: '#5C6BC0' },
            { max: 36, icon: '🎨', title: 'Creative Play', tip: `${name} loves pretend play and following instructions.`, bg: '#AB47BC' },
            { max: 999, icon: '⭐', title: 'Growing Up', tip: `${name} is developing wonderfully!`, bg: '#FF7043' },
        ];
        slides.push(ageTips.find(i => ageInMonths <= i.max) || ageTips[ageTips.length - 1]);

        // 2. Today's Activity
        const dailyActivity = getDailyPick(ageInMonths);
        if (dailyActivity) {
            slides.push({ icon: '🎯', title: "Today's Activity", tip: `Try: ${dailyActivity.title} — ${dailyActivity.description}`, bg: '#009688', route: '/dashboard/activities' });
        }

        // 3. Milestone Progress
        if (milestoneProgress != null) {
            slides.push({ icon: '📊', title: 'Milestones', tip: `${name} has achieved ${milestoneProgress}% of tracked milestones.${milestoneProgress > 0 ? ' Excellent progress!' : ''}`, bg: '#7B1FA2', route: '/dashboard/milestone-checklist' });
        } else {
            slides.push({ icon: '📋', title: 'Development', tip: `Start tracking ${name}'s milestones to get personalized developmental insights.`, bg: '#455A64', route: '/dashboard/milestone-checklist' });
        }

        // 4. Baby's Firsts
        if (trackerStats.firstsCount > 0) {
            slides.push({ icon: '🌟', title: "Baby's Firsts", tip: `You've captured ${trackerStats.firstsCount} special moments! Keep making beautiful memories.`, bg: '#FF9800', route: '/dashboard/firsts' });
        } else {
            slides.push({ icon: '⭐', title: "First Moments", tip: `Capture ${name}'s first smile or word in the Firsts Journal.`, bg: '#FFB74D', route: '/dashboard/firsts' });
        }

        // 5. Feeding
        if (trackerStats.feedingToday > 0) {
            slides.push({ icon: '🍼', title: 'Feeding Today', tip: `Well-fed and happy! You've logged ${trackerStats.feedingToday} feedings for ${name} today.`, bg: '#E91E63', route: '/dashboard/feeding' });
        } else {
            slides.push({ icon: '🍽️', title: 'Feeding Tracker', tip: `Log ${name}'s breastfeeding, bottles or solids to monitor nutrition.`, bg: '#F06292', route: '/dashboard/feeding' });
        }

        // 6. Sleep
        if (trackerStats.sleepToday > 0) {
            slides.push({ icon: '😴', title: 'Sleep Status', tip: `Sweet dreams! ${name} has logged some restful sleep today. Growth happens during rest!`, bg: '#512DA8', route: '/dashboard/sleep' });
        } else {
            slides.push({ icon: '🌙', title: 'Sleep Tracker', tip: `Track naps and nighttime sleep to understand ${name}'s daily patterns.`, bg: '#7986CB', route: '/dashboard/sleep' });
        }

        // 7. Teething
        if (trackerStats.teethingCount > 0) {
            slides.push({ icon: '🦷', title: 'Teething Progress', tip: `That growing smile! You've tracked ${trackerStats.teethingCount} teeth for ${name} so far.`, bg: '#4CAF50', route: '/dashboard/teething' });
        } else {
            slides.push({ icon: '👶', title: 'Teething Chart', tip: `Track when ${name}'s teeth erupt and manage those gummy smiles.`, bg: '#81C784', route: '/dashboard/teething' });
        }

        return slides;
    };

    const insightSlides = getInsightSlides();

    // Schedule reminder
    const scheduleReminder = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Notifications', 'Please enable notifications!', [], 'info');
                return;
            }
            await Notifications.scheduleNotificationAsync({
                content: { title: '⚠️ Milestone Reminder', body: "Don't forget to discuss your child's milestones.", sound: true },
                trigger: { type: 'timeInterval', seconds: 172800 },
            });
        } catch (e) { console.error(e); }
    };

    const handleDismissWithReminder = async () => {
        setMilestoneAlertDismissed(true);
        await AsyncStorage.setItem(`milestone_alert_dismissed_${selectedChild?.id}`, new Date().toISOString());
        scheduleReminder();
    };

    // Check milestones
    const checkMilestoneProgress = useCallback(async () => {
        if (!selectedChild?.id) { setMilestoneConcern(false); setMilestoneProgress(null); return; }
        try {
            const dismissedAt = await AsyncStorage.getItem(`milestone_alert_dismissed_${selectedChild.id}`);
            if (dismissedAt) {
                const d = new Date(dismissedAt);
                if (d > new Date(Date.now() - 2 * 86400000)) { setMilestoneAlertDismissed(true); return; }
            }
            setMilestoneAlertDismissed(false);

            // Get the tracking bucket age using MILESTONE_AGES logic
            const childAgeRaw = ageInMonths || 12;
            const allAges = MILESTONE_AGES.map(a => a.value);
            let trackingAge = allAges[0];
            for (const a of allAges) {
                if (childAgeRaw >= a) trackingAge = a;
                else break;
            }

            // Get total milestones available for this child's milestone age (across ALL categories)
            const milestonesForAge = getMilestonesForAge(trackingAge);
            let totalMilestones = 0;
            if (milestonesForAge) {
                for (const catId of Object.keys(milestonesForAge)) {
                    if (catId === 'ageLabel') continue;
                    const items = milestonesForAge[catId];
                    totalMilestones += Array.isArray(items) ? items.length : 0;
                }
            }

            const allResponses = await milestoneService.getAllMilestoneResponsesForChild(selectedChild.id, true);
            if (!allResponses || allResponses.length === 0) { setMilestoneConcern(false); setMilestoneProgress(null); return; }

            // Filter responses to ONLY the current age we are tracking, otherwise achieved counts past ages too
            const currentAgeResponses = allResponses.filter(r => Number(r.age_months) === trackingAge);

            let achieved = 0, hasConcern = false;
            for (const cat of currentAgeResponses) {
                const r = cat.responses;
                const t = Object.keys(r).length, y = Object.values(r).filter(v => v === 'yes').length;
                achieved += y;
                if (t > 0 && (y / t) < 0.5) hasConcern = true;
            }
            setMilestoneConcern(hasConcern);
            // Percentage = yes answers / total milestones for this age across all categories
            setMilestoneProgress(totalMilestones > 0 ? Math.min(100, Math.round((achieved / totalMilestones) * 100)) : null);
        } catch (e) { console.error(e); setMilestoneConcern(false); setMilestoneProgress(null); }
    }, [selectedChild?.id]);

    const fetchTrackerStats = useCallback(async () => {
        if (!selectedChild?.id) return;
        try {
            const childId = selectedChild.id;
            const today = new Date().toDateString();

            // 1. Feeding
            const feedingRaw = await AsyncStorage.getItem(`feeding_logs_${childId}`);
            const feedingLogs = feedingRaw ? JSON.parse(feedingRaw) : [];
            const feedingToday = feedingLogs.filter(l => new Date(l.timestamp).toDateString() === today).length;

            // 2. Sleep
            const sleepRaw = await AsyncStorage.getItem(`sleep_logs_${childId}`);
            const sleepLogs = sleepRaw ? JSON.parse(sleepRaw) : [];
            const sleepToday = sleepLogs.filter(l => new Date(l.timestamp).toDateString() === today).length;

            // 3. Teething
            const teethingRaw = await AsyncStorage.getItem(`teething_data_${childId}`);
            const teethingData = teethingRaw ? JSON.parse(teethingRaw) : {};
            const teethingCount = Object.keys(teethingData).length;

            // 4. Firsts
            const firstsRaw = await AsyncStorage.getItem(`firsts_journal_${childId}`);
            const firstsData = firstsRaw ? JSON.parse(firstsRaw) : { entries: {} };
            const firstsCount = Object.keys(firstsData.entries || {}).length;

            // 5. Vaccination check
            const vaccinesRaw = await AsyncStorage.getItem(`completed_vaccines_${childId}`);
            const completedVaccines = vaccinesRaw ? JSON.parse(vaccinesRaw) : [];
            const completedIds = completedVaccines.map(v => v.id);
            if (selectedChild.date_of_birth) {
                const status = getVaccinationStatus(selectedChild.date_of_birth, completedIds);
                setVaccineActionNeeded((status.dueVaccines.length + status.overdueVaccines.length) > 0);
            } else setVaccineActionNeeded(false);

            setTrackerStats({
                feedingToday,
                sleepToday,
                teethingCount,
                firstsCount,
            });
        } catch (e) {
            console.error('Error fetching tracker stats:', e);
        }
    }, [selectedChild?.id]);

    useEffect(() => {
        checkMilestoneProgress();
        fetchTrackerStats();
        fetchUpcomingAppointments();
    }, [checkMilestoneProgress, fetchTrackerStats]);

    useFocusEffect(
        useCallback(() => {
            fetchTrackerStats();
            checkMilestoneProgress();
        }, [fetchTrackerStats, checkMilestoneProgress])
    );

    const fetchUpcomingAppointments = async () => {
        try {
            const all = await appointmentService.getAppointments('scheduled', true);
            const now = new Date();
            const arr = Array.isArray(all) ? all : [];
            const future = arr.filter(a => {
                if (a.status !== 'scheduled' && a.status !== 'pending') return false;
                const d = new Date(a.appointment_date);
                const [h, m] = (a.appointment_time || '00:00').split(':').map(Number);
                d.setHours(h, m, 0, 0);
                return d >= now;
            }).sort((a, b) => new Date(a.appointment_date + 'T' + (a.appointment_time || '00:00')) - new Date(b.appointment_date + 'T' + (b.appointment_time || '00:00')));
            setUpcomingAppointments(future.slice(0, 2));
        } catch (e) { console.error(e); }
    };

    useFocusEffect(React.useCallback(() => { fetchUpcomingAppointments(); }, []));

    // Nav helper
    const isNavigating = useRef(false);
    const navigateTo = (route, params) => {
        if (isNavigating.current) return;
        if (!selectedChild) { showAlert('No Child Selected', 'Please select a child first.', [{ text: 'OK' }], 'warning'); return; }
        isNavigating.current = true;
        setTimeout(() => { isNavigating.current = false; }, 1000);
        if (params) router.push({ pathname: route, params }); else router.push(route);
    };

    // ─── RENDER ───
    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            {/* Header */}
            <View style={[styles.header, { 
                paddingTop: insets.top + Spacing.lg, 
                backgroundColor: isDark ? colorScheme.surface : colorScheme.primary, 
                borderBottomColor: isDark ? colorScheme.border : colorScheme.primary 
            }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
                        <MaterialIcons name="menu" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.greeting, { color: 'rgba(255, 255, 255, 0.8)' }]}>{getGreeting()},</Text>
                        <Text style={[styles.userName, { color: '#FFFFFF' }]}>{user?.displayName || 'Parent'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications')}>
                    <MaterialIcons name="notifications-none" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>
                {/* Child Selector */}
                <View style={styles.section}>
                    {selectedChild ? (
                        <TouchableOpacity style={[styles.childCard, { backgroundColor: isDark ? colorScheme.surface : '#FFFFFF' }]} onPress={() => router.push('/profile/children')}>
                            <View style={[styles.avatarContainer, { backgroundColor: isDark ? `${colorScheme.primary}25` : `${colorScheme.primary}10`, overflow: 'hidden' }]}>
                                {selectedChild.photo_url ? (
                                    <Image source={{ uri: selectedChild.photo_url }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <MaterialIcons name="face" size={30} color={colorScheme.primary} />
                                )}
                            </View>
                            <View style={styles.childInfo}>
                                <Text style={[styles.childName, { color: colorScheme.textPrimary }]}>{selectedChild.first_name} {selectedChild.last_name}</Text>
                                <Text style={[styles.childDetails, { color: colorScheme.textSecondary }]}>{calculateAge(selectedChild.date_of_birth)} old  •  {selectedChild.gender}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={colorScheme.textTertiary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.introContainer, { backgroundColor: colorScheme.surface }]}>
                            <View style={styles.introIconContainer}>
                                <Image source={require('../../../assets/images/beacon.jpg')} style={styles.introLogo} resizeMode="contain" />
                            </View>
                            <Text style={[styles.introTitle, { color: colorScheme.textPrimary }]}>
                                Welcome to{'\n'}
                                <Text style={{ color: colorScheme.primary }}>Beacon Children's Centre</Text>{'\n'}
                                Digital Platform
                            </Text>
                            <Text style={[styles.introText, { color: colorScheme.textSecondary }]}>
                                We are glad you are here. This platform is designed to support your parenting journey every step of the way and make it memorable!{'\n\n'}You can track your child's milestones, growth, vaccinations and get advice on daily care. Glad to walk with you and celebrate every milestone.
                            </Text>
                            <Text style={[styles.introPreButtonText, { color: colorScheme.textSecondary }]}>Add a child to get started</Text>
                            <TouchableOpacity style={[styles.introAddButton, { backgroundColor: colorScheme.primary }]} onPress={() => router.push('/profile/children/add')} activeOpacity={0.8}>
                                <MaterialIcons name="add-circle-outline" size={26} color="#FFF" />
                                <Text style={styles.introAddButtonText}>Add a Child</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Milestone Concern Warning */}
                {milestoneConcern && !milestoneAlertDismissed && selectedChild && (
                    <View style={[styles.warningBanner, { 
                        backgroundColor: isDark ? `${colorScheme.warning}25` : `${colorScheme.warning}10`, 
                        borderColor: isDark ? colorScheme.warning : '#FDE68A' // Light amber border for light mode
                    }]}>
                        <View style={styles.warningRow}>
                            <MaterialIcons name="warning" size={22} color={colorScheme.warning} />
                            <View style={styles.warningTextWrap}>
                                <Text style={[styles.warningTitle, { color: colorScheme.textPrimary }]}>Developmental Concern</Text>
                                <Text style={[styles.warningMsg, { color: colorScheme.textSecondary }]}>
                                    {selectedChild.first_name} could benefit from extra support in certain areas; we recommend scheduling an evaluation.
                                </Text>
                            </View>
                        </View>
                        <View style={styles.warningButtons}>
                            <TouchableOpacity style={[styles.warningBtn, { backgroundColor: colorScheme.warning }]} onPress={() => router.push('/appointments/book')}>
                                <Text style={styles.warningBtnText}>Book Appointment</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.warningBtnSec, { borderColor: colorScheme.warning }]} onPress={handleDismissWithReminder}>
                                <Text style={[styles.warningBtnSecText, { color: colorScheme.warning }]}>Remind Later</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ASD Re-assessment Reminder */}
                {isAsdDue && selectedChild && (
                    <View style={[styles.warningBanner, { 
                        backgroundColor: isDark ? `${colorScheme.primary}25` : `${colorScheme.primary}10`, 
                        borderColor: colorScheme.primary
                    }]}>
                        <View style={styles.warningRow}>
                            <MaterialIcons name="psychology" size={22} color={colorScheme.primary} />
                            <View style={styles.warningTextWrap}>
                                <Text style={[styles.warningTitle, { color: colorScheme.textPrimary }]}>ASD Screening Due</Text>
                                <Text style={[styles.warningMsg, { color: colorScheme.textSecondary }]}>
                                    It's been over a month since {selectedChild.first_name}'s last low-risk screening. It's time for a follow-up assessment.
                                </Text>
                            </View>
                        </View>
                        <View style={styles.warningButtons}>
                            <TouchableOpacity style={[styles.warningBtn, { backgroundColor: colorScheme.primary }]} onPress={() => router.push('/(tabs)/asd-checklist')}>
                                <Text style={styles.warningBtnText}>Take Assessment</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* 🌟 Insight Carousel — smooth crossfade */}
                {insightSlides.length > 0 && selectedChild && (
                    <View style={styles.section}>
                        <SmoothCarousel
                            data={insightSlides}
                            autoScrollMs={7000}
                            cardHeight={125}
                            renderCard={(item) => (
                                <TouchableOpacity
                                    style={[styles.insightCard, { backgroundColor: item.bg }]}
                                    onPress={() => item.route ? navigateTo(item.route) : navigateTo('/dashboard/milestone-checklist')}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.insightHeader}>
                                        <Text style={styles.insightEmoji}>{item.icon}</Text>
                                        <View style={styles.insightBadge}>
                                            <Text style={styles.insightBadgeText}>{item.title}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.insightTip}>{item.tip}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* 📊 Stats Row */}
                {selectedChild && (
                    <View style={styles.statsRow}>
                        <TouchableOpacity style={[styles.statCard, { backgroundColor: colorScheme.surface }]} onPress={() => navigateTo('/dashboard/milestone-checklist')}>
                            <View style={[styles.progressRing, { borderColor: milestoneProgress != null ? colorScheme.primary : colorScheme.border }]}>
                                <Text style={[styles.progressText, { color: colorScheme.primary }]} adjustsFontSizeToFit numberOfLines={1}>{milestoneProgress != null ? `${milestoneProgress}%` : '—'}</Text>
                            </View>
                            <Text style={[styles.statLabel, { color: colorScheme.textSecondary }]}>Milestones</Text>
                            <Text style={[styles.statSub, { color: colorScheme.textTertiary }]}>{milestoneProgress != null ? 'achieved' : 'not started'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.statCard, { backgroundColor: colorScheme.surface }]} onPress={() => router.push('/(tabs)/appointments')}>
                            {upcomingAppointments.length > 0 ? (
                                <>
                                    <View style={[styles.statIcon, { backgroundColor: `${colorScheme.primary}15` }]}>
                                        <MaterialIcons name="event" size={24} color={colorScheme.primary} />
                                    </View>
                                    <Text style={[styles.statLabel, { color: colorScheme.textSecondary }]}>Next Visit</Text>
                                    <Text style={[styles.statDate, { color: colorScheme.textPrimary }]}>
                                        {new Date(upcomingAppointments[0].appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <View style={[styles.statIcon, { backgroundColor: `${colorScheme.primary}15` }]}>
                                        <MaterialIcons name="add-circle" size={24} color={colorScheme.primary} />
                                    </View>
                                    <Text style={[styles.statDate, { color: colorScheme.primary }]} adjustsFontSizeToFit numberOfLines={1}>Book Appointment</Text>
                                    <Text style={[styles.statSub, { color: colorScheme.textTertiary }]}>No upcoming visits</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* 📈 Let's Track Progress */}
                {selectedChild && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary, textTransform: 'none', letterSpacing: 0, fontSize: Typography.fontSize.md }]}>Let's track progress</Text>
                        <View style={{ gap: 10 }}>
                            {/* Milestone Tracker (Blue) */}
                            <TouchableOpacity style={[styles.trackerRow, { backgroundColor: colorScheme.surface, borderBottomWidth: 0, borderRadius: 12 }]} onPress={() => navigateTo('/dashboard/milestone-checklist')}>
                                <View style={styles.trackerLeft}>
                                    <View style={[styles.trackerIcon, { backgroundColor: '#2196F320' }]}>
                                        <MaterialIcons name="checklist" size={20} color="#2196F3" />
                                    </View>
                                    <Text style={[styles.trackerName, { color: colorScheme.textPrimary }]}>Milestone tracker</Text>
                                </View>
                                <Text style={[styles.trackerStatus, { color: colorScheme.primary, fontWeight: 'bold' }]}>
                                    {milestoneProgress != null ? `${milestoneProgress}%` : '-'}
                                </Text>
                            </TouchableOpacity>

                            {/* Vaccination Tracker (Mint) */}
                            <TouchableOpacity style={[styles.trackerRow, { backgroundColor: colorScheme.surface, borderBottomWidth: 0, borderRadius: 12 }]} onPress={() => navigateTo('/dashboard/vaccinations')}>
                                <View style={styles.trackerLeft}>
                                    <View style={[styles.trackerIcon, { backgroundColor: '#00968820' }]}>
                                        <MaterialIcons name="vaccines" size={20} color="#009688" />
                                    </View>
                                    <Text style={[styles.trackerName, { color: colorScheme.textPrimary }]}>Vaccination tracker</Text>
                                </View>
                                <Text style={[styles.trackerStatus, { color: vaccineActionNeeded ? '#FF9800' : colorScheme.primary, fontWeight: 'bold' }]}>
                                    {vaccineActionNeeded ? 'Confirm Administration' : 'Up to date'}
                                </Text>
                            </TouchableOpacity>

                            {/* Growth Tracker (Mint) */}
                            <TouchableOpacity style={[styles.trackerRow, { backgroundColor: colorScheme.surface, borderBottomWidth: 0, borderRadius: 12 }]} onPress={() => navigateTo('/dashboard/growth-chart')}>
                                <View style={styles.trackerLeft}>
                                    <View style={[styles.trackerIcon, { backgroundColor: '#00968820' }]}>
                                        <MaterialIcons name="show-chart" size={20} color="#009688" />
                                    </View>
                                    <Text style={[styles.trackerName, { color: colorScheme.textPrimary }]}>Growth Tracker</Text>
                                </View>
                                <Text style={[styles.trackerStatus, { color: colorScheme.textSecondary }]}>
                                    View growth tracker
                                </Text>
                            </TouchableOpacity>

                            {/* Teething Tracker (Orange) */}
                            <TouchableOpacity style={[styles.trackerRow, { backgroundColor: colorScheme.surface, borderBottomWidth: 0, borderRadius: 12 }]} onPress={() => navigateTo('/dashboard/teething')}>
                                <View style={styles.trackerLeft}>
                                    <View style={[styles.trackerIcon, { backgroundColor: '#FF980020' }]}>
                                        <MaterialIcons name="child-care" size={20} color="#FF9800" />
                                    </View>
                                    <Text style={[styles.trackerName, { color: colorScheme.textPrimary }]}>Teething tracker</Text>
                                </View>
                                <Text style={[styles.trackerStatus, { color: colorScheme.textSecondary }]}>
                                    {trackerStats.teethingCount} {trackerStats.teethingCount === 1 ? 'tooth' : 'teeth'}
                                </Text>
                            </TouchableOpacity>

                            {/* Sleeping Tracker (Blue) */}
                            <TouchableOpacity style={[styles.trackerRow, { backgroundColor: colorScheme.surface, borderBottomWidth: 0, borderRadius: 12 }]} onPress={() => navigateTo('/dashboard/sleep')}>
                                <View style={styles.trackerLeft}>
                                    <View style={[styles.trackerIcon, { backgroundColor: '#2196F320' }]}>
                                        <MaterialIcons name="bedtime" size={20} color="#2196F3" />
                                    </View>
                                    <Text style={[styles.trackerName, { color: colorScheme.textPrimary }]}>Sleeping tracker</Text>
                                </View>
                                <Text style={[styles.trackerStatus, { color: colorScheme.textSecondary }]}>
                                    {trackerStats.sleepToday > 0 ? `${trackerStats.sleepToday} logs today` : 'No logs yet'}
                                </Text>
                            </TouchableOpacity>

                            {/* Feeding Tracker (Mint) */}
                            <TouchableOpacity style={[styles.trackerRow, { backgroundColor: colorScheme.surface, borderBottomWidth: 0, borderRadius: 12 }]} onPress={() => navigateTo('/dashboard/feeding')}>
                                <View style={styles.trackerLeft}>
                                    <View style={[styles.trackerIcon, { backgroundColor: '#00968820' }]}>
                                        <MaterialIcons name="restaurant" size={20} color="#009688" />
                                    </View>
                                    <Text style={[styles.trackerName, { color: colorScheme.textPrimary }]}>Feeding tracker</Text>
                                </View>
                                <Text style={[styles.trackerStatus, { color: colorScheme.textSecondary }]}>
                                    {trackerStats.feedingToday > 0 ? `${trackerStats.feedingToday} logs today` : 'No logs yet'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* 📋 Recent Activity */}
                {selectedChild && (
                    <View style={styles.section}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary, marginBottom: 0 }]}>Recent Activity</Text>
                            {recentActivity.length > 0 && (
                                <TouchableOpacity onPress={() => showAlert('Clear Activity', 'Are you sure you want to clear all recent activity?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: () => clearAll() }], 'warning')}>
                                    <Text style={{ color: colorScheme.error || '#FF5252', fontWeight: '600', fontSize: 12 }}>Clear</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {recentActivity.length > 0 ? (
                            <View style={[styles.card, { backgroundColor: colorScheme.surface, padding: 0 }]}>
                                {recentActivity.map((activity, index) => (
                                    <TouchableOpacity
                                        key={activity.id}
                                        style={[styles.recentItem, index !== recentActivity.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? colorScheme.border : 'rgba(0,0,0,0.05)' }]}
                                        onPress={() => router.push('/notifications')}
                                    >
                                        <View style={[styles.recentIcon, { backgroundColor: `${activity.category === 'appointments' ? colorScheme.appointmentScheduled : colorScheme.warning}15` }]}>
                                            <MaterialIcons name={activity.category === 'appointments' ? 'event' : 'flag'} size={18} color={activity.category === 'appointments' ? colorScheme.appointmentScheduled : colorScheme.warning} />
                                        </View>
                                        <View style={styles.recentContent}>
                                            <Text style={[styles.recentTitle, { color: colorScheme.textPrimary }]} numberOfLines={1}>{activity.title}</Text>
                                            <Text style={[styles.recentTime, { color: colorScheme.textSecondary }]}>
                                                {(() => { try { const d = new Date(activity.time); return !isNaN(d.getTime()) ? formatDistanceToNow(d, { addSuffix: true }) : 'Just now'; } catch { return 'Just now'; } })()}
                                            </Text>
                                        </View>
                                        <MaterialIcons name="chevron-right" size={18} color={colorScheme.textTertiary} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                                <View style={styles.emptyState}>
                                    <MaterialIcons name="inbox" size={40} color={colorScheme.textTertiary} />
                                    <Text style={[styles.emptyText, { color: colorScheme.textPrimary }]}>No recent activity</Text>
                                    <Text style={[styles.emptySub, { color: colorScheme.textSecondary }]}>Milestones and appointments will appear here</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    menuButton: { padding: Spacing.xs },
    greeting: { fontSize: Typography.fontSize.sm, marginBottom: 2 },
    userName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
    notificationButton: { padding: Spacing.sm },
    content: { flex: 1 },
    scrollContent: { padding: Spacing.lg },
    section: { marginBottom: Spacing.lg },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    sectionTitle: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
    // Child Card
    childCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, ...Shadow.sm },
    addChildCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.md },
    addChildText: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.medium },
    // Intro Section
    introContainer: { padding: Spacing.xxl, borderRadius: BorderRadius.xl, alignItems: 'center', ...Shadow.md, minHeight: 450, justifyContent: 'center', marginVertical: Spacing.xl },
    introIconContainer: { alignItems: 'center', marginBottom: Spacing.lg },
    introLogo: { width: 180, height: 120 },
    introTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, textAlign: 'center', marginBottom: Spacing.md, lineHeight: 32 },
    introText: { fontSize: Typography.fontSize.md, lineHeight: 24, textAlign: 'center', marginBottom: Spacing.xl, paddingHorizontal: Spacing.sm },
    introPreButtonText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, textAlign: 'center', marginBottom: Spacing.md, letterSpacing: 0.2 },
    introAddButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, borderRadius: BorderRadius.md, width: '80%', gap: Spacing.sm, ...Shadow.md, alignSelf: 'center' },
    introAddButtonText: { color: '#FFF', fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },
    avatarContainer: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
    childInfo: { flex: 1 },
    childName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, marginBottom: 2 },
    childDetails: { fontSize: Typography.fontSize.sm },
    // Insight Card
    insightCard: { borderRadius: BorderRadius.lg, padding: Spacing.lg, paddingBottom: Spacing.md, width: '100%' },
    insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
    insightEmoji: { fontSize: 28 },
    insightBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.md },
    insightBadgeText: { color: '#FFF', fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold },
    insightTip: { color: 'rgba(255,255,255,0.95)', fontSize: Typography.fontSize.sm, lineHeight: 20, flexShrink: 1 },
    // Stats
    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: { flex: 1, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', ...Shadow.sm },
    progressRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
    progressText: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, textAlign: 'center', paddingHorizontal: 4 },
    statLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium, marginTop: 2 },
    statSub: { fontSize: 10, marginTop: 1 },
    statDate: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold },
    statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
    // Tracker Table Section
    trackerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1 },
    trackerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    trackerIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    trackerName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
    trackerStatus: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium },
    // Feature Card
    featureCard: { borderRadius: BorderRadius.lg, padding: Spacing.lg, width: '100%' },
    featureIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
    featureTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, marginBottom: 4 },
    featureDesc: { fontSize: Typography.fontSize.xs, lineHeight: 18, marginBottom: Spacing.sm },
    featureCta: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
    featureCtaText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold },
    // Quick Links
    quickLinksRow: { gap: Spacing.sm },
    quickLink: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, ...Shadow.sm },
    quickLinkIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
    quickLinkLabel: { flex: 1, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
    // Card & Recent
    card: { borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadow.sm },
    recentItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
    recentIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
    recentContent: { flex: 1, marginRight: Spacing.sm },
    recentTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, marginBottom: 2 },
    recentTime: { fontSize: Typography.fontSize.xs },
    // Empty
    emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
    emptyText: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, marginTop: Spacing.sm, marginBottom: Spacing.xs },
    emptySub: { fontSize: Typography.fontSize.sm, textAlign: 'center', maxWidth: 250 },
    // Warning
    warningBanner: { marginBottom: Spacing.lg, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
    warningRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
    warningTextWrap: { flex: 1, marginLeft: Spacing.sm },
    warningTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, marginBottom: Spacing.xs },
    warningMsg: { fontSize: Typography.fontSize.sm, lineHeight: 22 },
    warningButtons: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
    warningBtn: { minWidth: '45%', flexGrow: 1, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center' },
    warningBtnText: { color: '#FFF', fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, textAlign: 'center' },
    warningBtnSec: { minWidth: '45%', flexGrow: 1, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center', backgroundColor: 'transparent' },
    warningBtnSecText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, textAlign: 'center' },
});
