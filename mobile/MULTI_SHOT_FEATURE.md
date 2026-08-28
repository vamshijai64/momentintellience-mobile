# Multi-Shot Analysis Feature

## Overview
Complete hybrid approach for handling videos with multiple cricket shots.

## User Flow

### 1. Upload Video → Auto-Detection
- Upload video with 3 shots (cover drive, pull shot, upper cut)
- Backend analyzes and returns: `shots: [shot1, shot2, shot3]`
- App shows: "✓ 3 Shots Detected"

### 2. Session Summary View (Default for Multi-Shot)
**Components:** `SessionSummaryView.tsx`

Shows:
- 📊 Overall session stats
- Average technique & execution scores
- Shot breakdown (✓ 2 Good, ~ 0 Average, ✗ 1 Bad)
- List of individual shots with scores
- "Compare All Shots" button

User Actions:
- Tap any shot → go to detail view
- Tap "Compare" → go to comparison view
- Tap "← CAMERA" → back to recording

### 3. Shot Detail View
**File:** `VideoAnalysisScreen.tsx` (enhanced)

Shows:
- Video player with MediaPipe overlay
- "← SUMMARY" button (back to summary)
- Badge: "3 Shots Detected • Showing Shot 1"
- Full analysis for ONLY the selected shot:
  - Shot verdict card
  - Joint angles (calculated per-shot, not averaged)
  - Technique scores
  - Recommendations

### 4. Shot Comparison View  
**Components:** `ShotComparisonView.tsx`

Shows:
- Side-by-side shot cards (swipeable)
- Each card displays:
  - Shot number badge
  - Verdict (Good/Average/Bad)
  - Shot type
  - Scores grid (Overall, Technique, Execution)
  - Shot direction
  - Analysis text
  - "View Full Analysis" button

User Actions:
- Swipe left/right to compare
- Tap "View Full Analysis" → go to detail view for that shot
- Tap "← Back" → back to summary

## Key Features

### ✅ Auto View Mode Selection
- Single shot → Direct to detail view
- Multiple shots → Start with summary view

### ✅ Per-Shot Metrics
- Joint angles calculated only for selected shot's frames
- No more mixed averages across all shots
- Each shot has its own verdict

### ✅ Clear Navigation
```
Summary → Detail (Shot 1)
        ↓
      Comparison
        ↓
      Detail (Shot 2/3)
```

### ✅ Visual Indicators
- Multi-shot badge shows current shot
- Color-coded verdicts (green/yellow/red)
- Progress indicators

## Backend Requirements

For this to work properly, your backend must return:

```json
{
  "video_id": "abc123",
  "report_json": {
    "shots": [
      {
        "shot_type": "COVER_DRIVE",
        "verdict": "GOOD_SHOT",
        "composite_score": 95,
        "technique_score": 93,
        "execution_score": 97,
        "shot_direction_deg": 45,
        "shot_direction_label": "Cover Drive",
        "impact_frame": 45,
        "reason": "Perfect timing and balance"
      },
      {
        "shot_type": "PULL_SHOT",
        "verdict": "AVERAGE_SHOT",
        "composite_score": 75,
        "technique_score": 72,
        "execution_score": 78,
        "shot_direction_deg": 90,
        "shot_direction_label": "Pull Shot",
        "impact_frame": 120,
        "reason": "Good contact but elbow dropped"
      },
      {
        "shot_type": "UPPER_CUT",
        "verdict": "BAD_SHOT",
        "composite_score": 50,
        "technique_score": 45,
        "execution_score": 55,
        "shot_direction_deg": 135,
        "shot_direction_label": "Upper Cut",
        "impact_frame": 200,
        "reason": "Off balance, poor footwork"
      }
    ],
    "overall_score": 73
  }
}
```

## Files Modified/Created

### New Files
- `src/screens/SessionSummaryView.tsx` - Summary dashboard
- `src/screens/ShotComparisonView.tsx` - Side-by-side comparison
- `MULTI_SHOT_FEATURE.md` - This file

### Modified Files
- `src/screens/VideoAnalysisScreen.tsx` - Added view mode logic

## Testing

1. **Single Shot Video:**
   - Should go directly to detail view
   - No summary view shown
   - Back button says "← RECORD AGAIN"

2. **Multi-Shot Video (3 shots):**
   - Starts with summary view
   - Shows "3 Shots Analyzed"
   - Can tap each shot to see details
   - Can compare shots side-by-side
   - Back button says "← SUMMARY" from detail view

3. **Navigation:**
   - Summary → Detail → Summary (loop works)
   - Summary → Comparison → Detail → Summary (full flow)
   - All back buttons work correctly

## Next Enhancements

Future improvements:
- Video seeking to shot timestamp
- Shot trimming/clipping
- Export individual shot analysis as PDF
- Comparison chart (bar graphs)
- Per-shot time-series angle graphs
