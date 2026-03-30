import type { GmatTopic } from '@/lib/gmat-types';

export type GmatTopicCatalog = {
  topic: GmatTopic;
  groups: Array<{
    key: string;
    label: string;
    items: string[];
  }>;
};

export const GMAT_TOPIC_CATALOG: GmatTopicCatalog[] = [
  {
    topic: 'Quant',
    groups: [
      {
        key: 'arithmetic',
        label: 'Arithmetic',
        items: [
          'Integers',
          'Even and Odd Numbers',
          'Prime Numbers',
          'Factors and Multiples',
          'Divisibility Rules',
          'Remainders',
          'LCM and HCF',
          'Fractions',
          'Decimals',
          'Percentages',
          'Ratio and Proportion',
          'Averages',
          'Weighted Averages',
          'Mixtures and Alligations',
          'Profit and Loss',
          'Simple Interest',
          'Compound Interest'
        ]
      },
      {
        key: 'algebra',
        label: 'Algebra',
        items: [
          'Linear Equations',
          'Simultaneous Equations',
          'Quadratic Equations',
          'Inequalities',
          'Absolute Value',
          'Exponents',
          'Roots',
          'Algebraic Expressions',
          'Polynomials',
          'Factoring',
          'Functions',
          'Sequences and Series',
          'Coordinate Geometry (basic)',
          'Maximum and Minimum Values'
        ]
      },
      {
        key: 'word_problems',
        label: 'Word Problems',
        items: [
          'Time Speed Distance',
          'Relative Speed',
          'Work and Time',
          'Pipes and Cisterns',
          'Overlapping Sets',
          'Set Theory Basics',
          'Venn Diagrams',
          'Age Problems',
          'Number Formation Problems',
          'Digits and Units Place',
          'Weighted Distribution Problems'
        ]
      },
      {
        key: 'number_properties',
        label: 'Number Properties',
        items: [
          'Number Line',
          'Positive and Negative Numbers',
          'Divisibility',
          'Prime Factorization',
          'Greatest Common Divisor',
          'Least Common Multiple',
          'Cyclic Patterns',
          'Units Digit Patterns',
          'Factorials',
          'Perfect Squares and Cubes'
        ]
      },
      {
        key: 'statistics_probability',
        label: 'Statistics and Probability',
        items: [
          'Mean Median Mode',
          'Range',
          'Standard Deviation (basic understanding)',
          'Combinations',
          'Permutations',
          'Probability Basics',
          'Conditional Probability (basic)',
          'Counting Principles'
        ]
      }
    ]
  },
  {
    topic: 'Verbal',
    groups: [
      {
        key: 'critical_reasoning',
        label: 'Critical Reasoning',
        items: [
          'Strengthen the Argument',
          'Weaken the Argument',
          'Assumption',
          'Evaluate the Argument',
          'Inference',
          'Conclusion Identification',
          'Boldface Questions',
          'Method of Reasoning',
          'Flaw in the Argument',
          'Resolve the Paradox',
          'Complete the Argument',
          'Must Be True',
          'Except Questions',
          'Parallel Reasoning',
          'Cause and Effect',
          'Evidence-Based Questions'
        ]
      },
      {
        key: 'reading_comprehension',
        label: 'Reading Comprehension',
        items: [
          'Main Idea',
          'Primary Purpose',
          'Specific Detail',
          'Inference',
          'Function of Paragraph',
          'Author Tone',
          'Author Attitude',
          'Logical Structure',
          'Strengthen / Weaken (RC based)',
          'Application Questions',
          'Vocabulary in Context'
        ]
      }
    ]
  },
  {
    topic: 'Data Insights',
    groups: [
      {
        key: 'question_types',
        label: 'Question Types',
        items: ['Data Sufficiency', 'Table Analysis', 'Graphic Interpretation', 'Multi-Source Reasoning', 'Two-Part Analysis']
      },
      {
        key: 'skills',
        label: 'Skills',
        items: [
          'Data Interpretation',
          'Chart and Graph Analysis',
          'Table Reading',
          'Multi-Source Data Synthesis',
          'Quantitative Reasoning with Data',
          'Verbal Reasoning with Data',
          'Logical Consistency Across Sources',
          'Decision Making Based on Data'
        ]
      },
      {
        key: 'data_formats',
        label: 'Data Formats',
        items: ['Bar Charts', 'Line Graphs', 'Pie Charts', 'Tables', 'Scatter Plots', 'Mixed Data Sets', 'Text + Data Combinations']
      },
      {
        key: 'data_sufficiency_skills',
        label: 'Data Sufficiency Skills',
        items: [
          'Statement Evaluation',
          'Sufficiency vs Solvability',
          'Elimination Techniques',
          'Rephrasing Questions',
          'Testing Edge Cases',
          'Combining Statements',
          'Avoiding Over-Solving'
        ]
      }
    ]
  }
];

export function getTopicCatalog(topic: GmatTopic): GmatTopicCatalog | undefined {
  return GMAT_TOPIC_CATALOG.find((entry) => entry.topic === topic);
}

export function getGroupItems(topic: GmatTopic, groupKey: string): string[] {
  const group = getTopicCatalog(topic)?.groups.find((entry) => entry.key === groupKey);
  return group?.items ?? [];
}
