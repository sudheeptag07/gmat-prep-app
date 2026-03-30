import type { GmatQuestion } from '@/lib/gmat-types';

export const GMAT_SEED_QUESTIONS: GmatQuestion[] = [
  {
    id: 'quant-algebra-identity-01',
    topic: 'Quant',
    subtopic: 'Algebra',
    difficulty: 'Medium',
    prompt: 'Symmetric expression shortcut',
    stem: 'If x + 1/x = 5, what is x^2 + 1/x^2 ?',
    choices: ['21', '23', '25', '27', '29'],
    correctAnswer: '23',
    recommendedTimeSeconds: 120,
    concepts: ['algebraic identities', 'symmetric expressions'],
    strategyTags: ['pattern recognition', 'identity shortcut'],
    trapType: 'calculation trap',
    patternType: 'symmetry',
    standardSolution: [
      'Square both sides of x + 1/x = 5.',
      'That gives x^2 + 2 + 1/x^2 = 25.',
      'Subtract 2 from both sides.',
      'So x^2 + 1/x^2 = 23.'
    ],
    alternativeMethods: [
      {
        name: 'Identity recognition',
        steps: [
          'Recognize the expression as the standard square identity.',
          'Apply (x + 1/x)^2 = x^2 + 2 + 1/x^2 directly.',
          'Subtract the constant term immediately.'
        ],
        whyItWorks: 'The question is built around a symmetric expression, so the identity removes the need for any solving.',
        speed: 'Fast',
        reliability: 'High',
        cognitiveLoad: 'Low',
        whenToUse: 'Use when the stem contains x plus or minus its reciprocal, or similar mirrored terms.'
      }
    ],
    topScorerNotice: 'The expression is symmetric, so an identity is more natural than solving for x.',
    commonTrap: 'Trying to solve for x itself before checking whether the target can be derived directly.',
    timeSavingInsight: 'Always test for identities before expanding or isolating variables.'
  },
  {
    id: 'quant-word-problem-rates-01',
    topic: 'Quant',
    subtopic: 'Word Problems',
    difficulty: 'Medium',
    prompt: 'Rate setup versus backsolving',
    stem: 'A machine fills a tank in 6 hours and a second machine fills the same tank in 4 hours. How many hours will they take working together?',
    choices: ['2.0', '2.4', '3.0', '4.8', '10.0'],
    correctAnswer: '2.4',
    recommendedTimeSeconds: 120,
    concepts: ['work rates', 'combined rates'],
    strategyTags: ['rate setup', 'backsolving'],
    trapType: 'conceptual trap',
    patternType: 'combined work',
    standardSolution: [
      'The first machine fills 1/6 of the tank per hour.',
      'The second fills 1/4 of the tank per hour.',
      'Together they fill 1/6 + 1/4 = 5/12 of the tank per hour.',
      'Time for one tank is 1 divided by 5/12, which is 12/5 = 2.4 hours.'
    ],
    alternativeMethods: [
      {
        name: 'LCM units',
        steps: [
          'Pretend the tank holds 12 units.',
          'Machine one fills 2 units per hour and machine two fills 3 units per hour.',
          'Together they fill 5 units per hour.',
          '12 divided by 5 gives 2.4 hours.'
        ],
        whyItWorks: 'Using a common-unit tank avoids fraction arithmetic and keeps the rate relationship concrete.',
        speed: 'Fast',
        reliability: 'High',
        cognitiveLoad: 'Low',
        whenToUse: 'Use when work or rate problems contain denominators that have a clean least common multiple.'
      }
    ],
    topScorerNotice: 'The denominators 6 and 4 invite an LCM of 12, which simplifies the arithmetic immediately.',
    commonTrap: 'Adding the hours directly instead of adding the work rates.',
    timeSavingInsight: 'In work problems, add work per hour, not time.'
  },
  {
    id: 'quant-number-properties-01',
    topic: 'Quant',
    subtopic: 'Number Properties',
    difficulty: 'Hard',
    prompt: 'Units digit pattern spotting',
    stem: 'What is the units digit of 7^43 ?',
    choices: ['1', '3', '7', '9', '5'],
    correctAnswer: '3',
    recommendedTimeSeconds: 90,
    concepts: ['units digit cycles', 'modular patterns'],
    strategyTags: ['pattern recognition', 'cycle'],
    trapType: 'calculation trap',
    patternType: 'cyclicity',
    standardSolution: [
      'List the units digits: 7^1 ends in 7, 7^2 ends in 9, 7^3 ends in 3, 7^4 ends in 1.',
      'The cycle length is 4.',
      'Compute 43 mod 4, which gives 3.',
      'So the units digit matches the third term in the cycle, which is 3.'
    ],
    alternativeMethods: [
      {
        name: 'Cycle compression',
        steps: [
          'Memorize or derive the four-term cycle for powers of 7.',
          'Reduce the exponent modulo 4.',
          'Map the remainder to the cycle.'
        ],
        whyItWorks: 'Units-digit questions almost always collapse into a short repeating cycle.',
        speed: 'Fast',
        reliability: 'High',
        cognitiveLoad: 'Medium',
        whenToUse: 'Use when powers are large and only the final digit matters.'
      }
    ],
    topScorerNotice: 'The stem asks only for the units digit, so the entire expression should collapse to a small cycle.',
    commonTrap: 'Trying to compute large powers numerically.',
    timeSavingInsight: 'When only the last digit matters, search for the repeat length first.'
  },
  {
    id: 'verbal-cr-strengthen-01',
    topic: 'Verbal',
    subtopic: 'Critical Reasoning',
    difficulty: 'Medium',
    prompt: 'Strengthen by reinforcing the weak link',
    stem: 'A city council member argues that building more bike lanes will reduce downtown traffic congestion because many current drivers live close enough to bike to work. Which choice most strengthens the argument?',
    choices: [
      'Many residents support environmentally friendly transportation policies.',
      'Several nearby cities built bike lanes after increasing parking fees.',
      'A recent survey found that a large share of downtown commuters would switch from driving to biking if protected bike lanes were added.',
      'Traffic congestion is usually worst during the winter months.',
      'The city already plans to expand bus service next year.'
    ],
    correctAnswer:
      'A recent survey found that a large share of downtown commuters would switch from driving to biking if protected bike lanes were added.',
    recommendedTimeSeconds: 120,
    concepts: ['argument structure', 'strengthen questions'],
    strategyTags: ['assumption lens', 'logical elimination'],
    trapType: 'relevance trap',
    patternType: 'causal support',
    standardSolution: [
      'Identify the conclusion: bike lanes will reduce traffic congestion.',
      'Identify the support: many drivers live close enough to bike.',
      'The missing assumption is that those drivers would actually switch to biking if lanes existed.',
      'The correct answer directly confirms that switch is likely.'
    ],
    alternativeMethods: [
      {
        name: 'Assumption lens',
        steps: [
          'Ask what must be true for the conclusion to follow from the evidence.',
          'Find the choice that most directly supports that missing bridge.',
          'Reject answers that are merely related to transportation policy.'
        ],
        whyItWorks: 'Strengthen questions are often fastest when you locate the weak link and then reinforce it directly.',
        speed: 'Fast',
        reliability: 'High',
        cognitiveLoad: 'Medium',
        whenToUse: 'Use when the argument has a clear gap between stated evidence and predicted behavior.'
      }
    ],
    topScorerNotice: 'The argument depends less on proximity than on actual behavior change.',
    commonTrap: 'Choosing a relevant transportation fact that does not make the conclusion more likely.',
    timeSavingInsight: 'Strengthen the bridge, not the topic.'
  },
  {
    id: 'verbal-cr-weaken-01',
    topic: 'Verbal',
    subtopic: 'Critical Reasoning',
    difficulty: 'Medium',
    prompt: 'Weaken the forecast',
    stem: 'A company claims that launching a premium subscription will significantly increase profits because customers have repeatedly asked for more advanced features. Which choice most weakens the argument?',
    choices: [
      'The company has not raised prices on its standard plan in three years.',
      'Most customers who requested advanced features also said they would be unwilling to pay more for them.',
      'Several competitors offer premium subscriptions with annual billing options.',
      'The company recently hired more engineers to build enterprise tools.',
      'Advanced features are used most often by long-term customers.'
    ],
    correctAnswer:
      'Most customers who requested advanced features also said they would be unwilling to pay more for them.',
    recommendedTimeSeconds: 120,
    concepts: ['argument structure', 'weaken questions'],
    strategyTags: ['assumption lens', 'logical elimination'],
    trapType: 'relevance trap',
    patternType: 'causal support',
    standardSolution: [
      'The conclusion is that a premium plan will significantly increase profits.',
      'The support is that customers asked for advanced features.',
      'The hidden assumption is that demand for features will convert into willingness to pay.',
      'The correct answer directly attacks that assumption.'
    ],
    alternativeMethods: [
      {
        name: 'Conclusion-to-assumption test',
        steps: [
          'State the conclusion in plain language.',
          'Ask what customer behavior must happen for it to become true.',
          'Pick the answer that makes that behavior less likely.'
        ],
        whyItWorks: 'Weaken questions move fastest when you attack the assumption that links evidence to the business outcome.',
        speed: 'Fast',
        reliability: 'High',
        cognitiveLoad: 'Medium',
        whenToUse: 'Use when the conclusion predicts an outcome such as more profit, more demand, or less risk.'
      }
    ],
    topScorerNotice: 'Asking for a feature is not the same as paying for a feature.',
    commonTrap: 'Choosing an answer that sounds negative but does not reduce the likelihood of higher profits.',
    timeSavingInsight: 'Separate interest from willingness to pay.'
  },
  {
    id: 'verbal-sc-grammar-01',
    topic: 'Verbal',
    subtopic: 'Sentence Correction',
    difficulty: 'Easy',
    prompt: 'Subject-verb agreement',
    stem: 'Choose the best version: The rise in housing prices, along with higher food costs, have made many families reduce discretionary spending.',
    choices: [
      'have made many families reduce',
      'has made many families reduce',
      'have made many families to reduce',
      'has made many families reducing',
      'have made many families reduced'
    ],
    correctAnswer: 'has made many families reduce',
    recommendedTimeSeconds: 90,
    concepts: ['subject-verb agreement'],
    strategyTags: ['grammar scan', 'logical elimination'],
    trapType: 'modifier trap',
    patternType: 'interruption',
    standardSolution: [
      'Find the true subject of the sentence, which is rise.',
      'The phrase along with higher food costs is interrupting information, not part of the subject.',
      'Because rise is singular, the verb should be has made.',
      'The verb pattern made many families reduce is the idiomatic construction.'
    ],
    alternativeMethods: [
      {
        name: 'Core sentence scan',
        steps: [
          'Strip out interrupting modifiers.',
          'Match the core subject to the verb.',
          'Check the remaining infinitive or base-verb structure.'
        ],
        whyItWorks: 'Sentence Correction is often fastest when you reduce the sentence to its grammatical skeleton.',
        speed: 'Fast',
        reliability: 'High',
        cognitiveLoad: 'Low',
        whenToUse: 'Use when long modifiers make agreement errors harder to see.'
      }
    ],
    topScorerNotice: 'Along with is a classic interrupter that hides the singular subject.',
    commonTrap: 'Matching the verb to the nearest plural noun instead of the actual subject.',
    timeSavingInsight: 'Collapse the sentence to subject plus verb before comparing choices.'
  },
  {
    id: 'di-table-analysis-01',
    topic: 'Data Insights',
    subtopic: 'Table Analysis',
    difficulty: 'Medium',
    prompt: 'Net gain from a table',
    stem: 'A table lists monthly sign-ups and cancellations for Product X. In April there were 420 sign-ups and 305 cancellations. What was the net subscriber change in April?',
    choices: ['+95', '+105', '+115', '-95', '-115'],
    correctAnswer: '+115',
    recommendedTimeSeconds: 135,
    concepts: ['table scan', 'difference computation'],
    strategyTags: ['structured extraction', 'single-pass arithmetic'],
    trapType: 'data selection trap',
    patternType: 'net change',
    standardSolution: [
      'Identify the two relevant entries in the same month: sign-ups and cancellations for April.',
      'Compute net change as sign-ups minus cancellations.',
      '420 - 305 = 115, so the net change is positive 115.',
      'Select +115.'
    ],
    alternativeMethods: [
      {
        name: 'Units-first scan',
        steps: [
          'Label the target as net = in - out before reading numbers.',
          'Pull only the April row values needed for that equation.',
          'Compute once and stop.'
        ],
        whyItWorks: 'DI table questions are faster when you define the operation before touching the data.',
        speed: 'Fast',
        reliability: 'High',
        cognitiveLoad: 'Low',
        whenToUse: 'Use when the prompt asks for change, margin, or difference from one row or one category.'
      }
    ],
    topScorerNotice: 'The challenge is selection, not math.',
    commonTrap: 'Adding the two values instead of taking their difference.',
    timeSavingInsight: 'State the equation in words first, then fetch only those cells.'
  },
  {
    id: 'di-graphics-interpretation-01',
    topic: 'Data Insights',
    subtopic: 'Graphics Interpretation',
    difficulty: 'Medium',
    prompt: 'Percent change from a chart',
    stem: 'A chart shows revenue of $80M in Year 1 and $92M in Year 2. What is the percent increase from Year 1 to Year 2?',
    choices: ['10%', '12%', '15%', '18%', '20%'],
    correctAnswer: '15%',
    recommendedTimeSeconds: 135,
    concepts: ['percent change', 'base value reasoning'],
    strategyTags: ['ratio setup', 'mental math'],
    trapType: 'base confusion trap',
    patternType: 'relative change',
    standardSolution: [
      'Compute the absolute increase: 92 - 80 = 12.',
      'Percent increase uses the original value as the base, so divide by 80.',
      '12/80 = 0.15.',
      'Convert to percent: 15%.'
    ],
    alternativeMethods: [
      {
        name: 'Scale-down ratio',
        steps: [
          'Write increase/base as 12/80.',
          'Reduce the fraction to 3/20.',
          'Convert 3/20 to 15%.'
        ],
        whyItWorks: 'Reducing the fraction prevents calculator-style long division and keeps the base explicit.',
        speed: 'Fast',
        reliability: 'High',
        cognitiveLoad: 'Low',
        whenToUse: 'Use when chart questions ask for growth rate, drop rate, or relative change.'
      }
    ],
    topScorerNotice: 'Relative change always anchors to the starting value.',
    commonTrap: 'Dividing by the new value instead of the original value.',
    timeSavingInsight: 'In percent-change questions, say base out loud before dividing.'
  },
  {
    id: 'di-two-part-analysis-01',
    topic: 'Data Insights',
    subtopic: 'Two-Part Analysis',
    difficulty: 'Hard',
    prompt: 'Two values that satisfy one condition',
    stem: 'Select one value for x and one value for y such that x + y = 14 and xy is maximized.',
    choices: ['x = 5, y = 9', 'x = 6, y = 8', 'x = 7, y = 7', 'x = 4, y = 10', 'x = 3, y = 11'],
    correctAnswer: 'x = 7, y = 7',
    recommendedTimeSeconds: 150,
    concepts: ['fixed sum product', 'quadratic symmetry'],
    strategyTags: ['pattern recognition', 'extremum shortcut'],
    trapType: 'search trap',
    patternType: 'optimization under constraint',
    standardSolution: [
      'For a fixed sum, the product is largest when the two numbers are equal.',
      'Since x + y = 14, equality gives x = y = 7.',
      'Check product: 7 * 7 = 49, larger than nearby pairs such as 6 * 8 = 48.',
      'Choose x = 7, y = 7.'
    ],
    alternativeMethods: [
      {
        name: 'Midpoint principle',
        steps: [
          'Take half of the fixed sum: 14/2 = 7.',
          'Set both values to the midpoint.',
          'Confirm quickly against one neighboring pair only.'
        ],
        whyItWorks: 'Two-part DI questions often reward a known structure more than full option-by-option testing.',
        speed: 'Fast',
        reliability: 'High',
        cognitiveLoad: 'Medium',
        whenToUse: 'Use when constraints fix a sum and the target asks for max or min product behavior.'
      }
    ],
    topScorerNotice: 'This is a structure-recognition question, not an exhaustive search question.',
    commonTrap: 'Testing all options without noticing the fixed-sum optimization rule.',
    timeSavingInsight: 'When sum is fixed and product is optimized, move to the midpoint immediately.'
  }
];
