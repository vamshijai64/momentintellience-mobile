export interface Landmark2D {
  id: number;
  name: string;
  x: number;
  y: number;
  pixel_x: number;
  pixel_y: number;
  visibility: number;
}

export interface JointAngles {
  left_elbow: number;
  right_elbow: number;
  left_knee: number;
  right_knee: number;
  left_hip: number;
  right_hip: number;
  spine_angle?: number;
}

export interface JointQuality {
  status: 'CORRECT' | 'MODERATE' | 'INCORRECT';
  color: string; // Hex color code
  message: string;
}

export interface ShotClassification {
  shot_type: string;
  confidence: number;
  kinetic_efficiency: number;
  shot_flaw: string;
}

export interface ShotVerdict {
  verdict: 'GOOD_SHOT' | 'AVERAGE_SHOT' | 'BAD_SHOT';
  technique_score: number;
  execution_score: number;
  composite_score: number;
  shot_direction_deg: number;
  shot_direction_label?: string;
  verdict_confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
  impact_frame: number;
  reason: string;
}

export interface AnalysisReport {
  id: string;
  video_id: string;
  overlay_video_path?: string;
  overlay_video_url?: string;
  original_video_url?: string;
  stability_score: number;
  balance_score: number;
  symmetry_score: number;
  mobility_score: number;
  overall_score: number;
  report_json: {
    summary: string;
    movement_profile: string;
    scores: {
      stability_score: number;
      balance_score: number;
      symmetry_score: number;
      mobility_score: number;
      overall_score: number;
    };
    shot_classification?: ShotClassification;
    shot_verdict?: ShotVerdict;
    shots?: ShotVerdict[];
    coaching_cue?: {
      ok?: boolean;
      cue?: string;
      bottom?: string;
      bubble?: string;
      head_still_ok?: boolean;
      head_over_foot_ok?: boolean;
      knee_ok?: boolean;
      balance_ok?: boolean;
    };
    time_series_angles?: any[];
    landmark_positions?: any[];
    observations: string[];
    recommendations: string[];
  };
}

export interface StumpAlignmentStatus {
  isAligned: boolean;
  stumpBoxDetected: boolean;
  pitchTiltAngle: number;
  tiltOptimal: boolean;
  guidanceText: string;
}
