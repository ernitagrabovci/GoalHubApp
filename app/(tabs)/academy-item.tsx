import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconTile } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { academyStore, useCollection } from '@/lib/store';

export default function AcademyItemScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const items = useCollection(academyStore);
  const item = items.find((a) => a.id === id) ?? items[0];
  const [shared, setShared] = useState(item.isShared);
  const [playing, setPlaying] = useState(false);

  const player = useVideoPlayer(require('@/assets/videos/intro.mp4'), (p) => {
    p.loop = true;
    p.muted = true;
  });

  const icon: IconSymbolName = item.type === 'video' ? 'play.fill' : 'calendar';

  const phases =
    item.type === 'session'
      ? [
          { time: '10 min', title: t('academyItem.activation'), detail: `Dynamic warm-up linked to ${item.category.toLowerCase()} movements.` },
          { time: item.duration, title: t('academyItem.phaseMain', { title: item.title }), detail: `Run the session at match tempo. Focus on quality of execution and quick transitions.` },
          { time: '10 min', title: t('academyItem.review'), detail: 'Bring the squad in, replay the key moments, and set the target for the next session.' },
        ]
      : [];

  const infoRows = [
    { label: t('academyItem.category'), value: t(`category.${item.category}`) },
    { label: t('academyItem.level'), value: t(`level.${item.level.toLowerCase()}`) },
    { label: t('academyItem.duration'), value: item.duration },
    { label: t('academyItem.type'), value: t(`academyCreate.type.${item.type}`) },
  ];

  return (
    <Screen back>
      {/* Item card */}
      <View style={styles.card}>
        <IconTile icon={icon} color={item.color} size={52} />
        <View style={styles.cardBody}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>
            {t(`category.${item.category}`)} · {t(`level.${item.level.toLowerCase()}`)}
          </Text>
          <View style={[styles.sharedTag, shared ? styles.sharedTagOn : styles.sharedTagOff]}>
            <IconSymbol
              name={shared ? 'link' : 'lock'}
              size={10}
              color={shared ? Colors.mintDim : Colors.textMuted}
            />
            <Text style={[styles.sharedText, { color: shared ? Colors.mintDim : Colors.textMuted }]}>
              {shared ? t('academy.shared') : t('academy.private')}
            </Text>
          </View>
        </View>
      </View>

      {item.type === 'video' ? (
        <>
          <SectionLabel>{t('academyItem.preview')}</SectionLabel>
          <Pressable style={styles.player} onPress={() => setPlaying(true)}>
            <View style={styles.playerTop}>
              <IconSymbol name="play.fill" size={34} color={Colors.mint} />
            </View>
            <View style={styles.playerBar}>
              <View style={styles.playerProgress} />
            </View>
            <View style={styles.playerMeta}>
              <Text style={styles.playerTime}>{item.duration}</Text>
              <Text style={styles.playerHint}>{t('academyItem.tapToPlay')}</Text>
            </View>
          </Pressable>
        </>
      ) : (
        <>
          <SectionLabel>{t('academyItem.sessionPlan')}</SectionLabel>
          <View style={styles.phasesCard}>
            {phases.map((p, i) => (
              <View key={p.title} style={[styles.phase, i < phases.length - 1 && styles.phaseBorder]}>
                <View style={styles.phaseHead}>
                  <Text style={styles.phaseTitle}>{p.title}</Text>
                  <Text style={styles.phaseTime}>{p.time}</Text>
                </View>
                <Text style={styles.phaseDetail}>{p.detail}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <SectionLabel>{t('academyItem.details')}</SectionLabel>
      <View style={styles.rowsCard}>
        {infoRows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowValue}>{r.value}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.shareRow} onPress={() => setShared((v) => !v)}>
        <View style={[styles.toggle, shared && styles.toggleOn]}>
          <View style={[styles.toggleKnob, shared && styles.toggleKnobOn]} />
        </View>
        <View style={styles.shareBody}>
          <Text style={styles.shareTitle}>{t('academyItem.shareWithSquad')}</Text>
          <Text style={styles.shareSub}>{t('academyItem.shareSub')}</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.primaryBtn}
        onPress={() => {
          alert(
            t(item.type === 'video' ? 'academyItem.alertWatch' : 'academyItem.alertPlan', {
              title: item.title,
            }),
          );
          router.back();
        }}>
        <IconSymbol name="plus" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.primaryBtnText}>
          {t(item.type === 'video' ? 'academyItem.addToWatch' : 'academyItem.addToPlan')}
        </Text>
      </Pressable>

      <Modal
        visible={playing}
        transparent
        animationType="fade"
        onRequestClose={() => setPlaying(false)}>
        <View style={styles.playerModal}>
          <VideoView
            player={player}
            style={styles.playerVideo}
            contentFit="cover"
            nativeControls
            allowsFullscreen
          />
          <Pressable style={styles.closePlayer} onPress={() => setPlaying(false)} hitSlop={8}>
            <IconSymbol name="xmark" size={18} color={Colors.text} />
            <Text style={styles.closePlayerText}>{t('academyItem.close')}</Text>
          </Pressable>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: Colors.mint,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sharedTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  sharedTagOn: {
    borderColor: `${Colors.mintDim}55`,
    backgroundColor: `${Colors.mintDim}1a`,
  },
  sharedTagOff: {
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  sharedText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  player: {
    backgroundColor: '#0B1D18',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  playerTop: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBar: {
    height: 3,
    backgroundColor: Colors.surfaceAlt,
  },
  playerProgress: {
    width: '38%',
    height: 3,
    backgroundColor: Colors.mint,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  playerTime: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  playerHint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'lowercase',
  },
  phasesCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  phase: {
    padding: Spacing.lg,
  },
  phaseBorder: {
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  phaseHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  phaseTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
  },
  phaseTime: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.mint,
  },
  phaseDetail: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  rowsCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  rowValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
    textTransform: 'capitalize',
    flexShrink: 1,
    textAlign: 'right',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    padding: 2,
  },
  toggleOn: {
    backgroundColor: Colors.mint,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.textMuted,
  },
  toggleKnobOn: {
    backgroundColor: Colors.textOnPrimary,
    marginLeft: 18,
  },
  shareBody: {
    flex: 1,
    gap: 2,
  },
  shareTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
    textTransform: 'lowercase',
  },
  shareSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  primaryBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  primaryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  playerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  playerVideo: {
    width: '100%',
    height: 240,
    borderRadius: Radius.lg,
    backgroundColor: '#000',
  },
  closePlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  closePlayerText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text,
    textTransform: 'lowercase',
  },
});
