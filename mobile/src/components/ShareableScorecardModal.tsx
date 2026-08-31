import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Share, Platform } from 'react-native';

interface ShareableScorecardModalProps {
  visible: boolean;
  onClose: () => void;
  score?: number;
  shotType?: string;
  shotDirectionLabel?: string;
  shotDirectionDeg?: number;
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
}

export const ShareableScorecardModal: React.FC<ShareableScorecardModalProps> = ({
  visible,
  onClose,
  score = 88,
  shotType = 'COVER DRIVE',
  shotDirectionLabel = 'COVER',
  shotDirectionDeg = 47,
  leadElbowAngle = 138,
  kneeFlexionAngle = 132,
}) => {
  const handleShare = async () => {
    try {
      const shareMessage = `🏏 AI CRICKET COACH PERFORMANCE CARD\n\n🎯 Shot: ${shotType}\n🏆 Pro Match Score: ${Math.round(score)}%\n⚡ Sector: ${shotDirectionLabel} (${Math.round(shotDirectionDeg)}°)\n🦾 Lead Elbow: ${Math.round(leadElbowAngle)}° (High Elevation)\n🦵 Front Knee: ${Math.round(kneeFlexionAngle)}° (Deep Stride)\n\nAnalyzed with Broadcast-Grade AI Cricket Coach!`;
      await Share.share({
        message: shareMessage,
        title: `${shotType} AI Analysis Card`,
      });
    } catch (err) {
      console.warn('Share error', err);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.cardContainer}>
          {/* Certificate Header Banner */}
          <View style={styles.certHeader}>
            <Text style={styles.certBrand}>AI CRICKET COACH</Text>
            <Text style={styles.certTitle}>OFFICIAL PERFORMANCE CERTIFICATE</Text>
          </View>

          {/* Player Identity & Shot Type */}
          <View style={styles.shotBanner}>
            <View>
              <Text style={styles.playerLabel}>BATSMAN SESSION</Text>
              <Text style={styles.shotTypeName}>{shotType}</Text>
            </View>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNum}>{Math.round(score)}%</Text>
              <Text style={styles.scoreSub}>PRO MATCH</Text>
            </View>
          </View>

          {/* Key Metric Highlights Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{Math.round(leadElbowAngle)}°</Text>
              <Text style={styles.metricKey}>LEAD ELBOW</Text>
              <Text style={styles.metricTag}>98% PRO MATCH</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>LOCKED</Text>
              <Text style={styles.metricKey}>HEAD-OVER-KNEE</Text>
              <Text style={styles.metricTag}>100% BALANCED</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{Math.round(kneeFlexionAngle)}°</Text>
              <Text style={styles.metricKey}>FRONT KNEE</Text>
              <Text style={styles.metricTag}>96% SOLID BASE</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{shotDirectionLabel}</Text>
              <Text style={styles.metricKey}>WAGON WHEEL</Text>
              <Text style={styles.metricTag}>{Math.round(shotDirectionDeg)}° OFF-DRIVE</Text>
            </View>
          </View>

          {/* Coach's Key Diagnosis */}
          <View style={styles.coachBox}>
            <Text style={styles.coachLabel}>COACH'S BIOMECHANICAL DIAGNOSIS:</Text>
            <Text style={styles.coachText}>
              "Elite front-foot stride with exceptional high-elbow elevation. Power directed cleanly through the Cover boundary."
            </Text>
          </View>

          {/* Action Buttons: Share to WhatsApp / Save / Close */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <Text style={styles.shareBtnIcon}>📤</Text>
              <Text style={styles.shareBtnText}>SHARE TO WHATSAPP</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>✕ CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0a1224',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    ...Platform.select({
      ios: { shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  certHeader: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: 14,
  },
  certBrand: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  certTitle: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  shotBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  playerLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shotTypeName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2.5,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: {
    color: '#34d399',
    fontSize: 18,
    fontWeight: '900',
  },
  scoreSub: {
    color: '#94a3b8',
    fontSize: 7,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 10,
    padding: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricVal: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '900',
  },
  metricKey: {
    color: '#e2e8f0',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },
  metricTag: {
    color: '#34d399',
    fontSize: 7.5,
    fontWeight: '800',
    marginTop: 2,
  },
  coachBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
    marginBottom: 14,
  },
  coachLabel: {
    color: '#38bdf8',
    fontSize: 8.5,
    fontWeight: '900',
    marginBottom: 3,
  },
  coachText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  shareBtnIcon: {
    fontSize: 14,
  },
  shareBtnText: {
    color: '#022c22',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  closeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
  },
});
