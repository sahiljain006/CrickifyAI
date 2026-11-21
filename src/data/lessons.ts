import { CricketLesson } from '../types';

export const CRICKET_LESSONS: CricketLesson[] = [
  {
    id: 'lesson-cricket-foundations',
    title: 'Introduction to Cricket, Pitch & Rules',
    category: 'Rules',
    tier: 'Beginner',
    level: 'Beginner',
    durationMinutes: 15,
    objectives: [
      'Understand the 22-yard pitch, popping crease, bowling crease, and wicket dimensions.',
      'Learn how runs, extras (wides, no-balls, byes), overs, and innings work across formats.',
      'Recognise the 10 standard modes of dismissal in cricket.',
    ],
    whyItMatters:
      'Understanding creases, lines, and scoring rules gives every beginner tactical clarity from day one so you never lose a wicket to avoidable mistakes like backing up too far or stepping outside the return crease.',
    equipment: ['Cricket ball', 'Set of 3 stumps with bails', 'Measuring tape or cones'],
    detailedExplanation:
      'Cricket is played between two teams of 11 players on an oval field with a central 22-yard (20.12 m) rectangular strip called the pitch. At each end stand three wooden stumps topped by two bails. The batting team scores runs by running between the popping creases (4 feet in front of the stumps) or hitting boundaries (4 runs if the ball bounces before the rope, 6 runs if it clears the rope on the full). An over consists of 6 legal deliveries bowled from alternate ends. Common dismissals include Bowled, Caught, LBW (Leg Before Wicket), Run Out, and Stumped.',
    bodyPositioning: [
      'Take guard with your bat blade aligned to middle, leg-and-middle, or off stump relative to the bowler’s release side.',
      'Keep your back foot grounded behind the popping crease before the ball enters play to avoid being stumped.',
      'Bowlers must land some part of their front foot behind the popping crease at impact to avoid a front-foot No-Ball.',
    ],
    steps: [
      'Walk out a 22-yard pitch and mark the popping crease 4 feet (1.22 m) in front of the stumps.',
      'Identify the off side (side the batter faces) and leg/on side (side behind the batter’s legs).',
      'Practise taking a middle-stump guard by asking a teammate or coach standing behind the bowler’s stumps.',
      'Walk through running between wickets: slide the bat into the crease with two hands when turning for a second run.',
      'Review calling signals: "Yes", "No", and "Wait" clearly and loudly with your batting partner.',
    ],
    diagramType: 'pitch',
    commonMistakes: [
      'Standing in front of the popping crease while waiting for a spin bowler, risking a stumping.',
      'Running without sliding the bat inside the crease on tight singles.',
      'Bowler cutting the return crease or overstepping the front popping crease.',
    ],
    corrections: [
      'Draw a chalk line or place a flat marker at the popping crease during practice so foot awareness becomes automatic.',
      'Hold the bat with the bottom hand slightly higher when sprinting and extend the arm forward to ground the blade early.',
    ],
    proTips: [
      'Before facing your first ball, look around the 30-yard circle to spot where gaps exist for easy singles.',
      'Always watch the fielder’s hands—not the crowd or umpire—when deciding on a second run.',
    ],
    drills: {
      beginner: 'Mark two creases 20 yards apart and complete 10 controlled two-run shuttles, sliding the bat past the line on every turn.',
      intermediate: 'Practise calling "Yes / No / Wait" with a partner off soft-ball drops into different ring gaps.',
      advanced: 'Simulate last-over 2-run pressure calls with a fielder charging in from mid-wicket.',
    },
    tutorialId: 'tut-grip-stance',
    quiz: [
      {
        question: 'What is the standard length of a full cricket pitch between the two sets of stumps?',
        options: ['18 yards', '20 yards', '22 yards', '24 yards'],
        correctIndex: 2,
        explanation: 'A regulation cricket pitch measures 22 yards (20.12 metres) from stumps to stumps.',
      },
      {
        question: 'Which foot placement by the bowler results in a front-foot No-Ball?',
        options: [
          'Front foot lands completely behind the popping crease',
          'No part of the front foot lands behind the popping crease',
          'Back foot touches the popping crease',
          'Front foot lands outside leg stump',
        ],
        correctIndex: 1,
        explanation: 'At least some part of the bowler’s front foot (grounded or raised) must be behind the popping crease at initial impact.',
      },
    ],
    practicalChecklist: [
      'Can identify popping, bowling, and return creases accurately.',
      'Can take a middle-stump guard independently.',
      'Demonstrates safe bat-sliding turn between wickets.',
    ],
    nextLessonId: 'lesson-batting-grip-stance',
  },
  {
    id: 'lesson-batting-grip-stance',
    title: 'Batting Grip, Guard & Balanced Stance',
    category: 'Batting',
    tier: 'Beginner',
    level: 'Beginner',
    durationMinutes: 20,
    objectives: [
      'Form the classic V-alignment with both hands on the bat handle.',
      'Distribute grip pressure correctly between the top and bottom hands.',
      'Build an athletic, head-still batting stance with consistent bat tap and backlift.',
    ],
    whyItMatters:
      'Almost every technical batting fault—closing the bat face too early, slicing drives to gully, or losing balance—starts in the grip and stance before the bowler even releases the ball.',
    equipment: ['Cricket bat', 'Mirror or phone camera', '2 cones for stance width'],
    detailedExplanation:
      'The top hand (left hand for a right-handed batter) controls the direction and straightness of the bat swing, while the bottom hand provides subtle support and power at contact. When holding the bat correctly, the "V" formed between your thumb and index finger on both hands should point roughly between the spine (ridge) and the outside edge of the bat. Your stance should feel like an athletic ready position: feet shoulder-width apart, knees gently flexed, weight evenly balanced on the balls of your feet, eyes level, and chin tucked slightly toward your front shoulder.',
    bodyPositioning: [
      'Top hand firmly controls the upper handle; bottom hand rests gently with thumb and forefinger relaxed.',
      'Feet parallel just outside hip width, toes pointing slightly toward cover/point.',
      'Eyes level and horizontal; nose positioned directly over or slightly inside the line of the toes.',
      'Hands resting calmly near the back hip or pocket before trigger movement.',
    ],
    steps: [
      'Lay the bat flat on the ground face-down, pick it up naturally with your top hand, then wrap the bottom hand comfortably below it with hands touching.',
      'Check both "V"s—they should align down the back ridge toward your right shoulder (for right-handers).',
      'Take your guard on middle or leg-and-middle stump and place feet parallel shoulder-width apart.',
      'Soften knees and hinge slightly from the hips while keeping your spine tall and eyes level.',
      'Practise a quiet 1-tap rhythm and lift the bat cleanly toward second slip/wicketkeeper.',
    ],
    diagramType: 'grip',
    commonMistakes: [
      'Bottom-hand grip too tight ("death grip"), causing the bat face to close and hit catches to mid-wicket.',
      'Head tilting sideways so one eye sits higher than the other, distorting depth perception.',
      'Feet set too narrow (poor balance) or excessively wide (restricted stride).',
    ],
    corrections: [
      'Hold the bat with only your top hand for 15 shadow straight drives to feel true top-hand leadership.',
      'Practise in front of a mirror or record a front-on clip in CRICKIFY to verify level eyes and shoulder alignment.',
    ],
    proTips: [
      'Keep your bottom-hand index finger and thumb lightly pinched—think of holding a tube of toothpaste without squeezing it out.',
      'Find a small, repeatable pre-ball trigger or calm stillness that puts your weight forward onto the balls of your feet at release.',
    ],
    drills: {
      beginner: 'Perform 20 one-handed top-hand shadow swings in front of a mirror, checking that the bat face stays straight toward the bowler.',
      intermediate: 'Shadow 30 balls combining your stance, calm bat tap, and backlift toward first/second slip.',
      advanced: 'Face 24 underarm tennis-ball feeds focusing solely on head stillness and zero bottom-hand takeover.',
    },
    tutorialId: 'tut-grip-stance',
    quiz: [
      {
        question: 'Which hand should act as the primary steering control in an orthodox batting grip?',
        options: ['Bottom hand', 'Top hand', 'Both hands equally tense', 'Neither—wrists only'],
        correctIndex: 1,
        explanation: 'The top hand steers the straight bat path and keeps the bat face square through the line of the ball.',
      },
      {
        question: 'Where should your head weight be distributed in a balanced batting stance?',
        options: [
          'Leaning heavily on the heels',
          'Tilted backward over the back foot',
          'Balanced over the balls of the feet with level eyes',
          'Locked stiff with straight knees',
        ],
        correctIndex: 2,
        explanation: 'Weight on the balls of the feet with level eyes lets you move smoothly forward or back.',
      },
    ],
    practicalChecklist: [
      'Both hand V-alignments point cleanly between spine and outside edge.',
      'Knees gently flexed with weight on the balls of the feet.',
      'Eyes stay horizontal without head tilt.',
    ],
    nextLessonId: 'lesson-cover-drive',
  },
  {
    id: 'lesson-cover-drive',
    title: 'Mastering the Front-Foot Cover Drive',
    category: 'Batting',
    tier: 'Intermediate',
    level: 'Intermediate',
    durationMinutes: 25,
    objectives: [
      'Lead the front-foot stride with the head and front shoulder toward the pitch of the ball.',
      'Keep the front elbow high and bat swing vertical through the line.',
      'Transfer weight smoothly into a stable, balanced contact position.',
    ],
    whyItMatters:
      'The cover drive teaches core front-foot biomechanics—head over front knee, weight transfer, and clean bat arc—that carry over to straight drives, off drives, and lofted hits.',
    equipment: ['Cricket bat', 'Batting cone or tee', 'Tennis or leather balls'],
    detailedExplanation:
      'A textbook cover drive begins with early length judgment: the ball is pitched full enough outside off stump for you to get your front foot close to its bounce. Instead of lunging with the foot first, allow your nose and front shoulder to lead the stride toward the ball. Your front knee bends softly to absorb weight while your back heel lifts naturally to allow full hip rotation. Keep your front elbow high pointing toward extra cover so the bat drops vertically down the line and meets the ball right under your eyes.',
    bodyPositioning: [
      'Head leaning forward directly over or slightly ahead of the bent front knee at contact.',
      'Front toe pointing down the pitch toward extra cover so hips stay open enough without falling over.',
      'Back heel lifted with back toe anchored for balance; avoid dragging the back foot unnecessarily.',
      'High front elbow guiding the bat face through to a high finish over the front shoulder.',
    ],
    steps: [
      'Start in your balanced stance with a clean backlift toward second slip.',
      'As the ball is released full outside off stump, dip your front shoulder slightly and step your head and front foot toward the pitch of the ball.',
      'Keep your hands back momentarily while your front foot lands heel-to-toe.',
      'Drive your front elbow forward and swing the bat down vertically to meet the ball under your eyes.',
      'Hold the balanced follow-through finish for two full seconds after contact.',
    ],
    diagramType: 'drive',
    commonMistakes: [
      'Reaching out with the hands while the head and front foot stay back ("fishing" outside off stump).',
      'Opening the front shoulder too early, causing the bat to slice across the ball.',
      'Placing the front foot too far across toward off stump, blocking the swing path.',
    ],
    corrections: [
      'Place a cone 6 inches inside the ball line to cue a direct stride alongside the ball rather than across it.',
      'Pause at the point of contact in shadow drills and check whether your nose sits above your front knee.',
    ],
    proTips: [
      'Only drive full balls you can reach under your eyes; if the ball lands slightly shorter than expected, check the shot into defense.',
      'Wait for the ball to come into your eyeline rather than pushing hard at it early.',
    ],
    drills: {
      beginner: 'Hit 25 stationary balls off a batting tee placed just outside off stump, holding your finish pose for 2 seconds each swing.',
      intermediate: 'Underarm drop-feeds from 5 metres away: step forward smoothly and drive straight back past the feeder along the carpet.',
      advanced: 'Mixed-length front-foot throwdowns where you must drive full half-volleys and defend good-length balls.',
    },
    tutorialId: 'tut-cover-drive-2026',
    quiz: [
      {
        question: 'Which body parts should initiate the forward movement into a cover drive?',
        options: [
          'Both hands pushing forward first',
          'Head and front shoulder leading the front foot',
          'Back hip twisting first',
          'Front heel stamping hard before watching the ball',
        ],
        correctIndex: 1,
        explanation: 'Leading with the head and front shoulder brings your eyes over the ball and keeps weight balanced.',
      },
      {
        question: 'Where should contact ideally take place during a controlled cover drive?',
        options: [
          'Directly underneath your eyes and beside your front pad',
          'Two feet ahead of your front foot',
          'Behind your back pad',
          'High above shoulder height',
        ],
        correctIndex: 0,
        explanation: 'Playing the ball right under your eyes gives maximum control and timing.',
      },
    ],
    practicalChecklist: [
      'Head finishes directly over bent front knee.',
      'Front toe points toward the intended shot line.',
      'Bat finishes high over the shoulder without falling off-balance.',
    ],
    nextLessonId: 'lesson-pull-shot',
  },
  {
    id: 'lesson-pull-shot',
    title: 'Back-Foot Pull Shot & Playing Short Bowling',
    category: 'Batting',
    tier: 'Intermediate',
    level: 'Intermediate',
    durationMinutes: 25,
    objectives: [
      'Recognise short-pitched bowling early out of the bowler’s hand.',
      'Transfer weight decisively onto the back foot and clear the front hip.',
      'Roll the wrists at contact to keep the pull shot controlled along the ground.',
    ],
    whyItMatters:
      'Without a reliable back-foot game, fast bowlers can pin you on the crease with short-of-a-length deliveries. Mastering the pull shot turns defensive pressure into scoring momentum.',
    equipment: ['Cricket bat', 'Helmet and protective gear for hard balls (or tennis balls for drills)'],
    detailedExplanation:
      'Playing the pull shot safely requires decisive back-foot movement and disciplined height judgment. When you spot a short delivery early, transfer your weight back onto your back leg—either stepping back and across toward off stump or opening the front hip slightly for a front-foot pull against medium pace. Keep your eyes level and meet the ball slightly out in front of your body between waist and chest height. Extending your arms and rolling the top hand/wrists over the ball keeps it angled downward.',
    bodyPositioning: [
      'Weight anchored solidly on the ball of the back foot with back knee slightly flexed.',
      'Head upright and eyes fixed on the ball—never pull away toward square leg before impact.',
      'Bat starts from a high backlift and swings slightly downward across the ball’s flight.',
    ],
    steps: [
      'Watch the bowler’s hand and spot the short length early.',
      'Move your weight swiftly onto the back foot while keeping your head tall and level.',
      'Raise your hands smoothly above the line of the bounce.',
      'Swing horizontally from high to slightly low, meeting the ball out in front of the front hip.',
      'Roll the wrists through contact and finish with your hands wrapping around your front shoulder.',
    ],
    diagramType: 'pull',
    commonMistakes: [
      'Taking eyes off the ball or leaning backward away from the pitch.',
      'Swinging upward from a low backlift, sending top-edged catches straight up.',
      'Trying to pull balls that are too full or outside off stump without getting inside the line.',
    ],
    corrections: [
      'Practise with soft/sponge balls first so you keep your head still and eyes locked through impact.',
      'Start with high hands in shadow swings so the bat path meets the ball flat or slightly downward.',
    ],
    proTips: [
      'Always judge height first: chest-to-waist high is ideal to pull; rib-to-chin balls that climb steeper than expected should be swayed away from or ducked cleanly.',
    ],
    drills: {
      beginner: 'Soft-ball knee-to-chest tosses from 5 metres: step back, keep eyes level, and hit flat into the ground.',
      intermediate: 'High-speed tennis-ball wall bounce feeds to build early length pickup and wrist roll.',
      advanced: 'Mixed full/short throwdowns requiring instant switch between front-foot drive and controlled pull.',
    },
    tutorialId: 'tut-pull-shot',
    quiz: [
      {
        question: 'Why do batters top-edge the pull shot high into the air?',
        options: [
          'They keep their hands too high',
          'They swing upward from a low backlift or pull late with eyes turning away',
          'They transfer weight onto the back foot too early',
          'They roll their wrists at impact',
        ],
        correctIndex: 1,
        explanation: 'Swinging upward or pulling late with the head turning away exposes the top edge of the bat.',
      },
    ],
    practicalChecklist: [
      'Back foot weight is stable without falling onto heels.',
      'Eyes track ball to contact point in front of front hip.',
      'Wrists roll over ball to control trajectory.',
    ],
    nextLessonId: 'lesson-playing-spin',
  },
  {
    id: 'lesson-playing-spin',
    title: 'Playing Spin: Using Your Feet, Sweep & Soft Hands',
    category: 'Batting',
    tier: 'Intermediate',
    level: 'Intermediate',
    durationMinutes: 25,
    objectives: [
      'Read turn, flight, and drift out of the spinner’s hand rather than off the pitch.',
      'Know when to smother the ball right at the pitch vs rock deep into the crease.',
      'Execute the sweep and soft-handed defense safely against turning deliveries.',
    ],
    whyItMatters:
      'Spin bowlers set traps through subtle changes of pace and drift. Batters who commit to either getting all the way to the pitch of the ball or deep onto the back foot take the spin out of the equation.',
    equipment: ['Cricket bat', 'Pads', 'Cones marking pitch zones'],
    detailedExplanation:
      'Against spin, indecisive half-steps create catches at slip or bat-pad. You have two primary safe zones: either stride/advance all the way to meet the ball on the half-volley before it turns, or stay deep inside the crease so you have maximum time to read the spin off the turf. For defensive blocks against turning balls, relax your bottom hand ("soft hands") so edges die near your feet instead of carrying to close catchers. When sweeping, get your front pad outside the line of leg stump only if the ball is pitched outside leg or clearly spinning away from the stumps, keeping your head well forward and rolling the bat face down.',
    bodyPositioning: [
      'Watch the bowler’s wrist and fingers at release—stay tall until the ball leaves the hand.',
      'When advancing down the pitch, stay upright and balanced with short, quick steps so your head stays still.',
      'In the sweep, drop onto the back knee with front foot planted toward the ball and head over the front pad.',
    ],
    steps: [
      'Track the spinner’s hand to identify flight and spin direction early.',
      'Decide immediately: get right to the bounce, or wait deep on the back foot.',
      'Play with the spin when possible, or smother with soft bottom hand.',
      'For the sweep, stride outside the line with head low and hit downward from high hands.',
    ],
    diagramType: 'drive',
    commonMistakes: [
      'Lunging halfway down the pitch and reaching with hard hands.',
      'Sweeping across the line to balls pitching straight on middle/off stump with big turn.',
    ],
    corrections: [
      'Use two marker cones on the pitch: "smother zone" (half-volley) and "deep zone" (back-foot crease). Commit to one or the other.',
    ],
    proTips: [
      'Listen for changes in pace and watch the seam rotation; scrambled seam or flatter trajectory often warns of an arm ball or slider.',
    ],
    drills: {
      beginner: 'Underarm spinning feeds: alternate between smothering forward defense and rocking deep onto the back foot.',
      intermediate: 'Practise dropping the front pad and sweeping low tennis balls along the carpet toward square leg.',
      advanced: 'Face mixed off-spin and arm-ball feeds from 16 yards, calling "forward" or "back" aloud before impact.',
    },
    tutorialId: 'tut-off-spin',
    quiz: [
      {
        question: 'What does "soft hands" mean when defending against a turning ball?',
        options: [
          'Swinging slowly',
          'Relaxing the bottom hand at impact so an edge drops harmlessly rather than carrying to slip',
          'Holding the bat at the bottom of the handle',
          'Closing the bat face early',
        ],
        correctIndex: 1,
        explanation: 'Relaxing the bottom hand absorbs the ball’s pace on impact so edges drop short of close catchers.',
      },
    ],
    practicalChecklist: [
      'Commits fully forward to the bounce or deep back into the crease.',
      'Keeps bottom hand relaxed in close-catching defense.',
    ],
    nextLessonId: 'lesson-fast-bowling-action',
  },
  {
    id: 'lesson-fast-bowling-action',
    title: 'Fast Bowling Mechanics: Run-Up, Gather & Release',
    category: 'Bowling',
    tier: 'Beginner',
    level: 'Beginner',
    durationMinutes: 25,
    objectives: [
      'Develop a smooth, rhythmic run-up with consistent step count.',
      'Align hips, shoulders, and back foot cleanly at the gather and bound.',
      'Brace the front leg and pull the non-bowling arm down smoothly through release.',
    ],
    whyItMatters:
      'An aligned, repeatable bowling action generates natural pace and accuracy while protecting your lower back and shoulder from mixed-action twisting stress.',
    equipment: ['Cricket ball', 'Cones for run-up marker', 'Single stump target'],
    detailedExplanation:
      'Every effective fast bowling spell relies on rhythm rather than brute force. Your run-up should accelerate gradually so you arrive at the popping crease balanced and under control. As you jump into the bound and gather, align your back foot, hips, and shoulders consistently (side-on, semi-open, or front-on) rather than twisting your shoulders one way and hips another. Plant a strong, braced front leg pointing down the pitch, pull your high non-bowling arm sharply toward your left hip (for right-armers), and follow through smoothly past the crease.',
    bodyPositioning: [
      'Eyes locked firmly on your target spot on the pitch throughout the gather and delivery.',
      'Back foot lands stable beneath your centre of mass without collapsing inward.',
      'Non-bowling arm reaches high toward the sky before pulling straight down past your front hip.',
      'Follow-through continues forward down the pitch toward the target for 3–5 decelerating strides.',
    ],
    steps: [
      'Measure a relaxed 12–16 stride run-up by running smoothly away from the stumps with eyes closed or relaxed.',
      'Build rhythm gradually from a walk-in jog to athletic sprinting speed in the final 4 strides.',
      'Jump gently into the gather and align shoulders and hips cleanly.',
      'Pull the front arm down as the front foot braces straight and strong.',
      'Snap the wrist behind the seam and run smoothly through the follow-through.',
    ],
    diagramType: 'bowling-action',
    commonMistakes: [
      'Mixed action: hips facing front-on while upper body twists closed side-on (increases lower-back stress).',
      'Collapsing the front knee completely at release, leaking energy and dropping length short.',
      'Falling away to the leg side after delivery, pulling the ball wide down leg.',
    ],
    corrections: [
      'Film both side-on and front-on practice clips in CRICKIFY to inspect hip/shoulder alignment and front-leg stability.',
      'Respect youth and amateur workload limits: build bowling volume gradually and schedule rest days between heavy spells.',
    ],
    proTips: [
      'Note: Pose analysis from regular phone video can observe alignment and balance patterns, but only qualified biomechanical assessment can formally evaluate action legality.',
    ],
    drills: {
      beginner: 'Walk-in 3-step deliveries focusing on non-bowling arm pull-down and straight follow-through.',
      intermediate: 'Run-up rhythm shuttle: hit your bound marker 10 times in a row without looking down at the crease.',
      advanced: 'Full run-up target bowling with a cone gate to keep follow-through momentum aligned toward the stumps.',
    },
    tutorialId: 'tut-fast-bowling-action',
    quiz: [
      {
        question: 'Why is a "mixed" bowling action risky for fast bowlers?',
        options: [
          'It makes the ball swing too much',
          'Counter-rotation between hips and shoulders places excessive stress on the lower spine',
          'It slows down the run-up',
          'It automatically causes wides',
        ],
        correctIndex: 1,
        explanation: 'When hips and shoulders face conflicting alignments at back-foot contact, the lumbar spine experiences high torsional load.',
      },
    ],
    practicalChecklist: [
      'Run-up accelerates smoothly without stutter steps.',
      'Hips and shoulders stay aligned through gather.',
      'Follow-through stays straight inside target channel.',
    ],
    nextLessonId: 'lesson-yorker-variations',
  },
  {
    id: 'lesson-yorker-variations',
    title: 'Yorker Mastery, Swing & Death-Over Variations',
    category: 'Bowling',
    tier: 'Advanced',
    level: 'Advanced',
    durationMinutes: 25,
    objectives: [
      'Nail the target spot at the base of the stumps or batter’s toes for accurate yorkers.',
      'Adjust seam angle and wrist position for conventional inswing and outswing.',
      'Bowl deceptive off-cutters and split-finger slower balls without telegraphing the grip.',
    ],
    whyItMatters:
      'In limited-overs and turf cricket, bowling predictable length gets punished. Mixing a sharp yorker with subtle swing and pace changes gives you control in the powerplay and death overs.',
    equipment: ['Leather or tennis cricket balls', '3 flat target cones at crease level'],
    detailedExplanation:
      'To swing a new ball conventionally, hold the seam upright with your index and middle fingers straddling the seam and thumb underneath. Point the seam slightly toward fine leg (for inswing) or first slip (for outswing) with the shiny side facing the direction opposite the intended swing. For yorkers, shift your visual target from the good-length spot right down to the base of the popping crease or the batter’s back toe, maintaining high arm speed and full follow-through so you do not drag the ball into a low full toss. For slower balls, keep the exact same run-up speed and arm speed while rolling the fingers down the side of the ball (off-cutter) or widening the fingers (split-finger).',
    bodyPositioning: [
      'Keep arm speed identical across stock balls, yorkers, and slower balls.',
      'Wrist stays firm and directly behind the ball at release for clean seam presentation.',
      'Commit fully through the crease—slowing the body down causes yorkers to drop into full tosses.',
    ],
    steps: [
      'Set a flat cone or towel right on the popping crease in front of off/middle stump.',
      'Lock your eyes onto that exact spot throughout the run-up and release.',
      'Release slightly later at the top of the arc with full arm speed to drive the ball into the crease.',
      'Alternate 3 yorkers with 1 disguised off-cutter or slower ball.',
    ],
    diagramType: 'yorker',
    commonMistakes: [
      'Decelerating the bowling arm when attempting a yorker or slower ball.',
      'Allowing the wrist to cock sideways when trying to force swing.',
    ],
    corrections: [
      'Practise yorker targeting with a towel placed right on the popping crease—aim to hit the towel on the full or on the exact edge.',
    ],
    proTips: [
      'Hide your grip inside your non-bowling hand during the run-up so batters cannot pick slower balls early.',
    ],
    drills: {
      beginner: 'Target towel drill from half run-up: land 6 out of 12 deliveries inside the yorker zone.',
      intermediate: 'Seam-spin tosses: spin the ball straight up in the air 20 times keeping the seam completely wobble-free.',
      advanced: '6-ball death-over simulation: 2 wide yorkers, 2 stump yorkers, 1 hard length bouncer, 1 slower off-cutter.',
    },
    tutorialId: 'tut-fast-bowling-drills',
    quiz: [
      {
        question: 'What is the most common reason a bowler accidentally delivers a waist-high full toss when trying to bowl a yorker?',
        options: [
          'Holding the seam upright',
          'Releasing early or dropping arm speed/front leg stability at release',
          'Running in too fast',
          'Looking at the popping crease',
        ],
        correctIndex: 1,
        explanation: 'Early release or losing front-leg height and arm speed disrupts the release arc, turning a yorker into a full toss.',
      },
    ],
    practicalChecklist: [
      'Maintains identical arm speed on slower deliveries.',
      'Keeps eyes locked on crease target through release.',
    ],
    nextLessonId: 'lesson-spin-bowling',
  },
  {
    id: 'lesson-spin-bowling',
    title: 'Spin Bowling: Off-Spin, Leg-Spin & Flight Control',
    category: 'Bowling',
    tier: 'Intermediate',
    level: 'Intermediate',
    durationMinutes: 25,
    objectives: [
      'Build clean revolutions on the ball using finger or wrist action.',
      'Understand how revolutions create drift in the air and dip onto the pitch.',
      'Develop stock delivery consistency before adding googlies, arm balls, or top-spinners.',
    ],
    whyItMatters:
      'Spinners take wickets through deception in the air—not just turn off the surface. High revolutions create Magnus-force drift and late dip that beat batters in flight.',
    equipment: ['Cricket balls (two-tone taped ball optional to track spin)', 'Target cones'],
    detailedExplanation:
      'In off-spin (finger spin for right-armers), place your index and middle fingers across the seam, pivot over a braced front leg, and rip your index finger sharply down the side of the ball as your bowling shoulder comes over. In leg-spin (wrist spin), hold the ball with two fingers up and two bent underneath across the seam, turn the back of your hand toward the batter, and flick the wrist upward and over the top of the ball at release. Always build your stock spinning delivery first so batters respect your turn; only then introduce an arm ball (off-spin) or googly/top-spinner (leg-spin).',
    bodyPositioning: [
      'Strong upright posture through the crease—avoid collapsing laterally.',
      'Front arm pulls down inside the hip to generate shoulder torque and energy transfer.',
      'Follow through past the front leg so momentum goes toward the target.',
    ],
    steps: [
      'Practise gripping the seam cleanly and imparting crisp spin at short distance (5–8 yards) with a partner.',
      'Add a rhythmic 4–6 step approach with a smooth gather.',
      'Aim above the batter’s eyeline to create natural loop and dip into a 4th-stump target box.',
      'Finish with your bowling shoulder rotating fully toward the target.',
    ],
    diagramType: 'spin',
    commonMistakes: [
      'Bowling too flat and fast without imparting enough revolutions.',
      'Trying too many variations before landing the stock ball consistently.',
    ],
    corrections: [
      'Tape half a tennis or leather ball white/black so you can visually count the spin axis and wobble after release.',
    ],
    proTips: [
      'Vary your pace subtly between 75–85 km/h equivalent effort rather than bowling every ball at the same speed.',
    ],
    drills: {
      beginner: '10-yard spin tosses to a partner focusing solely on hearing and seeing crisp seam revolutions.',
      intermediate: 'Loop-and-drop cone challenge: lob the ball over a height marker (string/stump) to land inside a 1m x 1m target box.',
      advanced: 'Over simulation: 4 stock balls on off-stump channel, 1 wider flighted lure, 1 variation.',
    },
    tutorialId: 'tut-leg-spin',
    quiz: [
      {
        question: 'What creates late "drift" and "dip" in the air for a spin bowler?',
        options: [
          'Bowling as flat as possible',
          'High ball revolutions interacting with airflow (Magnus effect)',
          'Stepping outside the return crease',
          'Holding the ball with all five fingertips',
        ],
        correctIndex: 1,
        explanation: 'Rapid spin revolutions create pressure differences in the air that pull the ball sideways (drift) and downward (dip).',
      },
    ],
    practicalChecklist: [
      'Stock ball spins cleanly without seam wobble.',
      'Front arm drives rotation cleanly through the crease.',
    ],
    nextLessonId: 'lesson-fielding-catching',
  },
  {
    id: 'lesson-fielding-catching',
    title: 'Catching, Ground Fielding & Direct-Hit Throwing',
    category: 'Fielding',
    tier: 'Beginner',
    level: 'Beginner',
    durationMinutes: 20,
    objectives: [
      'Adopt an explosive, balanced ready position as the bowler releases.',
      'Catch high and low balls cleanly with soft, cushioned hands.',
      'Execute clean two-handed ground pickups and accurate side-on throws.',
    ],
    whyItMatters:
      'Every saved boundary, sharp catch, or direct-hit run-out swings momentum faster than any single shot. Great fielding makes every bowler look more threatening.',
    equipment: ['Cricket or tennis balls', '2 cones', 'Single target stump'],
    detailedExplanation:
      'Elite fielding starts before the ball is hit: split-step onto the balls of your feet as the bowler hits their delivery stride so you can react left, right, or forward immediately. For high catches, sprint hard to get underneath the ball early, cup your hands softly (fingers pointing upward for chest/eye height or interlocked little fingers below the waist), and give with the ball into your body. On ground balls, attack the ball in a controlled arc, get low with knees bent and head behind the line, scoop cleanly with two hands (or one hand on the run), crow-hop side-on, point your front glove/hand at the stumps, and release smoothly over the top.',
    bodyPositioning: [
      'Ready stance: feet wider than shoulders, knees bent, hands open in front of thighs, weight forward.',
      'Throwing alignment: non-throwing shoulder pointing directly at the target stumps.',
      'Catching hands: relaxed fingers, soft elbows absorbing impact rather than jabbing at the ball.',
    ],
    steps: [
      'Perform a subtle split-step jump just before the batter makes contact.',
      'On ground balls, lower your hips (not just your waist) so your eyes stay level with the turf.',
      'Field the ball slightly outside or in front of your lead foot and bring it smoothly to your chest ("gather").',
      'Crow-hop side-on, point your front arm at the target, and release over the top with full follow-through.',
    ],
    diagramType: 'catching',
    commonMistakes: [
      'Waiting flat-footed on the heels during the bowler’s run-up.',
      'Reaching out stiff-armed with hard palms on catches, causing the ball to bounce out.',
      'Throwing across the body without aligning the front shoulder toward the target.',
    ],
    corrections: [
      'Practise against a brick/concrete wall with a tennis ball from 3 metres to train soft hands and rapid eye focus.',
    ],
    proTips: [
      'Always dive safely onto your forearm/hip and slide with momentum rather than jamming elbows or wrists straight into hard turf.',
    ],
    drills: {
      beginner: '30 one-bounce and no-bounce wall catches focusing on quiet, cushioned fingers.',
      intermediate: '4-cone ground pickup and relay throw to a single stump target.',
      advanced: 'High-ball communication drill: call "MINE!" early while tracking catches over the shoulder.',
    },
    tutorialId: 'tut-high-catches',
    quiz: [
      {
        question: 'Why should fielders "give" with their hands and elbows when taking a fast catch?',
        options: [
          'To throw faster',
          'To cushion the impact and prevent the ball from rebounding out of stiff palms',
          'To hide the ball from the umpire',
          'To save energy',
        ],
        correctIndex: 1,
        explanation: 'Soft hands absorb kinetic energy over a slightly longer distance, stopping the ball from popping back out.',
      },
    ],
    practicalChecklist: [
      'Performs timely split-step as bowler delivers.',
      'Lowers hips on ground pickups with eyes behind the ball.',
      'Aligns non-throwing shoulder cleanly toward target.',
    ],
    nextLessonId: 'lesson-wicketkeeping',
  },
  {
    id: 'lesson-wicketkeeping',
    title: 'Wicketkeeping Fundamentals: Stance, Rising & Glovework',
    category: 'Wicketkeeping',
    tier: 'Intermediate',
    level: 'Intermediate',
    durationMinutes: 20,
    objectives: [
      'Position correctly for both pace bowlers (standing back) and spinners (standing up).',
      'Stay low through the bounce and rise smoothly with the ball rather than standing up early.',
      'Take clean takes on both leg-side and off-side lines.',
    ],
    whyItMatters:
      'A reliable wicketkeeper saves vital byes, turns half-chances into stumpings and catches, and anchors team communication behind the stumps.',
    equipment: ['Wicketkeeping gloves', 'Inner gloves', 'Pads', 'Cones'],
    detailedExplanation:
      'When keeping to pace, position yourself comfortably behind the stumps so the ball reaches you around waist height as it begins its downward dip. Crouch low with weight balanced on the balls of your feet, head still and aligned just outside off stump so you have an unobstructed view of the ball from release to bat. Stay down through the bounce and let the ball bring your gloves and body upward together—standing up too early makes low balls clip the heel of your palm. When standing up to spin, keep your gloves soft just behind the bails, watch the ball onto the gloves, and sweep smoothly onto the stumps in one fluid motion.',
    bodyPositioning: [
      'Balanced squat with knees outside elbows, fingers pointing down toward the turf.',
      'Head stays still at the point of bounce; avoid lunging hands forward.',
      'Step toward the ball with small lateral footwork rather than reaching with straight arms.',
    ],
    steps: [
      'Align outside off stump so you can track the ball clearly past the batter’s hip.',
      'Hold a relaxed low squat with glove fingers pointed down.',
      'Move your feet sideways first before extending your gloves on wide deliveries.',
      'Absorb the catch cleanly into the webbing/pocket of the gloves.',
    ],
    diagramType: 'wicketkeeping',
    commonMistakes: [
      'Rising out of the crouch before the ball pitches.',
      'Standing too close or too far back against pace bowlers.',
    ],
    corrections: [
      'Keep your chin near knee height until you see the ball bounce off the pitch.',
    ],
    proTips: [
      'Take off only one glove when throwing from behind the stumps if needed, or practise throwing cleanly with gloves on for fast run-outs.',
    ],
    drills: {
      beginner: 'Bare-handed or gloved low catches off uneven wall/ramp deflections to keep eyes low.',
      intermediate: 'Standing-up blind-feed stumping drill where a partner blocks or misses spin throws.',
      advanced: 'Lateral footwork leg-side take drill off fast side-arm feeds.',
    },
    tutorialId: 'tut-fielding-secrets',
    quiz: [
      {
        question: 'When should a wicketkeeper begin rising out of their crouch?',
        options: [
          'Before the bowler releases the ball',
          'As soon as the ball pitches, rising smoothly with the bounce height',
          'Only after the batter hits it',
          'Never rise—always stay fully crouched',
        ],
        correctIndex: 1,
        explanation: 'Staying low until the bounce lets you adjust smoothly to variable bounce rather than chasing low balls.',
      },
    ],
    practicalChecklist: [
      'Stays low through pitch bounce before rising.',
      'Moves feet laterally on wide balls.',
    ],
    nextLessonId: 'lesson-masterclass-t20-odi',
  },
  {
    id: 'lesson-masterclass-t20-odi',
    title: 'Professional Masterclass: T20, ODI & Test Tactics',
    category: 'Masterclass',
    tier: 'Professional Masterclass',
    level: 'Advanced',
    durationMinutes: 30,
    objectives: [
      'Differentiate innings pacing and risk profiles across Test, ODI, and T20 formats.',
      'Build tactical bowling plans matched to dynamic field placements.',
      'Manage pressure moments, partnerships, and match awareness as a batter or captain.',
    ],
    whyItMatters:
      'Technique wins isolated balls, but tactical match intelligence wins whole matches. Knowing when to absorb pressure and when to accelerate separates club players from complete competitors.',
    equipment: ['Fielding diagram board or CRICKIFY Match IQ planner'],
    detailedExplanation:
      'Every format demands a distinct tactical blueprint. In T20 cricket, maximizing the 6-over Powerplay (only 2 fielders outside the 30-yard circle) sets the platform before rotating strike aggressively through middle overs (7–15) and attacking death-over match-ups (16–20). In ODIs, teams pace 50 overs across three phases: protecting wickets early, building partnerships with minimal dot balls from overs 11–40, and launching with wickets in hand at the death. In Test/red-ball cricket, patience rules—batters leave balls outside off stump to tire bowlers out while bowlers attack a persistent 4th-stump channel with slip catchers waiting. Captains connect bowling lines directly to where fielders stand: never bowl short with fine leg up unless setting a deliberate trap.',
    bodyPositioning: [
      'Pre-ball mental routine: step away from the crease, take one calm breath, survey the field gaps, then lock into technical focus.',
    ],
    steps: [
      'Identify the match phase (Powerplay, Middle Overs, Death Overs) and current required run rate.',
      'Spot the bowler’s defensive plan by reading their field ring vs boundary riders.',
      'Select high-percentage scoring options into the biggest open gaps before attempting high-risk shots.',
      'As a bowler or captain, bowl strictly to the side of the pitch where your boundary protection sits.',
    ],
    diagramType: 'fielding',
    commonMistakes: [
      'Playing high-risk aerial shots straight to deep boundary fielders during low-risk middle overs.',
      'Bowling wide outside off with a packed leg-side boundary field.',
    ],
    corrections: [
      'Use CRICKIFY Match IQ after every game to audit dot-ball percentage, scoring zones, and dismissal patterns.',
    ],
    proTips: [
      'In tight chases, breaking a 48-run target off 24 balls into four manageable 12-run overs keeps panic away.',
    ],
    drills: {
      beginner: 'Open-field gap spotting: call out 2 safe single options before every net delivery.',
      intermediate: 'Target-scenario nets: chase 18 runs in 12 balls against realistic field markers.',
      advanced: 'Full 6-over tactical match simulation with dynamic field changes and bowling-plan reviews.',
    },
    tutorialId: 'tut-cover-drive-2026',
    quiz: [
      {
        question: 'In standard white-ball Powerplay overs, how many fielders are allowed outside the 30-yard circle?',
        options: ['Up to 2 fielders', 'Up to 4 fielders', 'Up to 5 fielders', 'Zero fielders'],
        correctIndex: 0,
        explanation: 'During the initial Powerplay (Powerplay 1), a maximum of 2 fielders are permitted outside the 30-yard circle.',
      },
    ],
    practicalChecklist: [
      'Surveys field placements before taking guard.',
      'Matches bowling lines cleanly to field protection.',
    ],
    nextLessonId: 'lesson-defense-cut-running',
  },
  {
    id: 'lesson-defense-cut-running',
    title: 'Forward Defense, Square Cut & Smart Running Between Wickets',
    category: 'Batting',
    tier: 'Beginner',
    level: 'Beginner',
    durationMinutes: 22,
    objectives: [
      'Build an impenetrable forward defense with bat and front pad close together.',
      'Punish short-and-wide deliveries cleanly with a balanced back-foot square cut.',
      'Master decisive calling, backing up, and bat-sliding turns between wickets.',
    ],
    whyItMatters:
      'Great innings are built on trusting your defense against good balls, punishing width with the cut, and turning dot balls into crisp singles.',
    equipment: ['Cricket bat', 'Pads & gloves', 'Tennis or leather balls', '2 cones for crease turning'],
    detailedExplanation:
      'A reliable forward defense neutralises swinging and seaming deliveries: lead with your nose and front shoulder, bend the front knee so your head sits over the point of contact, keep your bat angled slightly downward right beside your front pad so no gap exists, and relax the bottom hand. When a bowler errs short and wide outside off stump, shift back and across onto your back foot and strike downward over the ball toward point/backward point using strong wrists. Between wickets, always back up cleanly behind the popping crease as the bowler delivers, call "Yes", "No", or "Wait" immediately after impact, and run with the bat held forward to slide smoothly across the crease line.',
    bodyPositioning: [
      'Forward defense: bat face angled gently downward directly in front of or just outside the front pad with zero gap.',
      'Square cut: back foot steps back and slightly toward off stump; eyes level above the ball’s bounce height.',
      'Running: lean forward into the turn, touch or slide the bat flat across the popping crease with eyes on the fielder.',
    ],
    steps: [
      'Step smoothly into a forward defensive stride with nose over front knee and soft bottom hand.',
      'Practise holding bat and pad side by side ("closing the gate") for 15 shadow blocks.',
      'On short wide balls, transfer weight onto the back foot and cut downward from high hands.',
      'Complete 2-run shuttles calling early and grounding the bat cleanly before turning.',
    ],
    diagramType: 'drive',
    commonMistakes: [
      'Leaving a gap between bat and front pad during defense ("bowled through the gate").',
      'Cutting balls that are too full or too close to off stump, causing an edge to slips/keeper.',
      'Ball-watching instead of running hard on the first step.',
    ],
    corrections: [
      'Place a soft cone beside your front pad in drills to cue compact bat-pad alignment.',
      'Only cut deliveries outside off stump that allow your arms to extend freely.',
    ],
    proTips: [
      'On a tight two, make your first call loud before reaching the halfway mark and look at the fielder’s hands—not the ball in mid-air.',
    ],
    drills: {
      beginner: '15 forward defensive blocks off underarm half-volleys focusing on dead, soft hands.',
      intermediate: 'Mixed feed drill: defend straight good-length balls and cut short wide feeds.',
      advanced: 'Pressure shuttle drill: push soft singles into ring gaps and convert tight twos with bat-sliding turns.',
    },
    tutorialId: 'tut-cover-drive-tips',
    quiz: [
      {
        question: 'Why must the bat stay close beside the front pad during a forward defense?',
        options: [
          'To hit the ball harder',
          'To eliminate the gap between bat and pad so the ball cannot bowl you through the gate',
          'To step outside leg stump',
          'To appeal for a wide',
        ],
        correctIndex: 1,
        explanation: 'Keeping bat and front pad tightly aligned blocks the inside gap and prevents LBW or bowled dismissals.',
      },
    ],
    practicalChecklist: [
      'Eliminates gap between bat and front pad on defensive blocks.',
      'Swings downward over short wide cut deliveries.',
      'Calls early and slides bat cleanly past crease on turns.',
    ],
    nextLessonId: 'lesson-umpire-signals-formats',
  },
  {
    id: 'lesson-umpire-signals-formats',
    title: 'Umpire Signals, Fielding Restrictions & Match Formats',
    category: 'Rules',
    tier: 'Beginner',
    level: 'Beginner',
    durationMinutes: 15,
    objectives: [
      'Recognise every standard umpire signal including Out, Four, Six, Wide, No-Ball, Bye, Leg-Bye, and Free Hit.',
      'Understand Powerplay fielding circles and bowling over limits across T20, ODI, Test, and Box Cricket.',
      'Apply fair play, sportsmanship, and safety laws on the field.',
    ],
    whyItMatters:
      'Reading umpire signals instantly and knowing Powerplay circle rules lets players adapt field placements, rotation, and free-hit strategy without confusion.',
    equipment: ['Fielding diagram or cones marking a 30-yard ring'],
    detailedExplanation:
      'Umpires communicate match decisions cleanly with standardized hand signals: raised index finger (Out), arms stretched horizontally (Wide), one arm extended horizontally with rotation (No-Ball—followed by a circular finger motion overhead for a Free Hit in white-ball formats), arm swept across the chest four times (Four), both arms raised straight up (Six), raised open palm (Bye), and touching a raised knee (Leg-Bye). Format rules govern pacing: T20 features 20 overs per side (max 4 overs per bowler, 6-over Powerplay with max 2 outside the circle); ODI features 50 overs (max 10 overs per bowler, Powerplays 1–3); Test cricket allows unlimited overs over 5 days with red/pink ball endurance.',
    bodyPositioning: [
      'As a batter on a Free Hit, remember you can only be dismissed by Run Out, Hit the Ball Twice, or Obstructing the Field—swing freely with balanced head.',
    ],
    steps: [
      'Memorize the difference between Byes (no bat/body contact) and Leg-Byes (off pad/body while playing a genuine shot or evading).',
      'Check Powerplay fielder limits before setting fields in white-ball innings.',
      'Verify bowler over limits and front-foot crease legality in your team’s bowling rotation.',
    ],
    diagramType: 'fielding',
    commonMistakes: [
      'Stealing a leg-bye without attempting a shot or evading—umpire signals Dead Ball.',
      'Exceeding the maximum fielders outside the 30-yard circle during Powerplay overs (triggers a No-Ball).',
    ],
    corrections: [
      'Appoint one captain/mid-off player to count outer-ring fielders before every new over begins.',
    ],
    proTips: [
      'Always keep track of whether a No-Ball grants a Free Hit under your tournament or local turf rules.',
    ],
    drills: {
      beginner: 'Signal recognition flash check: call out the rule & consequence for 8 umpire signals.',
      intermediate: 'Powerplay ring drill: position 9 fielders cleanly within T20 Powerplay restrictions.',
      advanced: 'Captaincy checklist: rotate 5 bowlers across 20 overs respecting max-4-over limits and death-over match-ups.',
    },
    tutorialId: 'tut-grip-stance',
    quiz: [
      {
        question: 'What happens if a captain accidentally leaves 3 fielders outside the 30-yard circle during a T20 Powerplay (Overs 1–6)?',
        options: [
          'Play continues normally',
          'The umpire calls a No-Ball (and Free Hit in standard white-ball regulations)',
          'The batter loses a run',
          'An extra over is added',
        ],
        correctIndex: 1,
        explanation: 'Violating fielding circle restrictions results in an immediate No-Ball penalty.',
      },
    ],
    practicalChecklist: [
      'Identifies Wide, No-Ball, Free Hit, Bye, and Leg-Bye signals accurately.',
      'Sets valid 30-yard circle fields for Powerplay and Middle overs.',
    ],
    nextLessonId: 'lesson-batting-grip-stance',
  },
];

