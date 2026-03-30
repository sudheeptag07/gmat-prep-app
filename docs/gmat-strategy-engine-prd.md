# Seeing GMAT Product Brief

## Positioning

Seeing GMAT is a GMAT prep app that teaches users how to think, not just which answer to pick.

- Not a question bank
- Not a mock test platform
- Strategy engine + thinking coach

The product should make users feel: "I did not just solve this question. I learned how to see it faster next time."

## Problem

Most GMAT prep tools underperform because they:

- show only one solution path
- optimize for accuracy instead of speed
- do not teach method selection
- fail to explain why a shortcut works

The result is slower improvement and early plateaus.

## Core Product Loop

1. User attempts a question in a clean interface with an automatic timer.
2. User optionally marks confidence.
3. After submission, the app shows:
   - result layer: correctness, timing, confidence mismatch
   - standard solution: baseline step-by-step path
   - alternative approaches: 2 to 3 methods when applicable
   - thinking layer: top-scorer signals, trap, time-saving insight
   - comparison layer: method speed, reliability, and trigger conditions

## Explanation System

Every question explanation should include:

- Standard solution
- Alternative methods with:
  - method name
  - concise steps
  - why it works here
  - speed label
  - reliability label
  - cognitive load label
  - when to use it
- Thinking layer:
  - what top scorers notice
  - common traps
  - one-line time-saving insight

## Content Model

Topics:

- Quant
- Verbal

Quant subdomains:

- Algebra
- Arithmetic
- Number Properties
- Geometry
- Word Problems
- Data Sufficiency

Verbal subdomains:

- Critical Reasoning
- Reading Comprehension
- Sentence Correction

Difficulty levels:

- Easy
- Medium
- Hard

Tagging system per question:

- concepts
- strategy types
- trap type
- pattern type

## User Flows

### Onboarding

Collect:

- target score
- strength areas
- time availability

Return:

- suggested starting topics

### Core Flow

Topic -> Question -> Feedback -> Next Question

### Review Flow

Filter past questions by:

- incorrect
- slow
- wrong strategy used

### Practice Modes

- Practice Mode: learning-first, softer timing
- Timed Mode: GMAT-like pacing with full post-attempt feedback

## Feedback and Personalization

Track on each attempt:

- accuracy
- time taken
- confidence
- strategy used
- timestamp

Ask after submission:

- What approach did you use?
- algebra
- plugging numbers
- guess
- other

Personalization should detect:

- low topic accuracy
- slow correct answers
- repeated trap failures
- overuse of inefficient methods

Personalized recommendations should suggest:

- specific subtopics
- strategy drills
- focused sessions such as "Practice 10 questions using only backsolving"

## Data Model

Core entities:

- User
- Question
- Topic
- Subtopic
- Strategy
- Attempt
- Performance Metrics

Attempt fields:

- user_id
- question_id
- answer
- correct
- time_taken
- strategy_used
- confidence
- timestamp

## AI Layer

AI support areas:

- generate multiple valid solution paths
- classify solutions by method, speed, and reliability
- generate personalized efficiency feedback
- label likely traps

## Delivery Roadmap

### MVP

- topic-wise questions
- standard solution plus one alternative
- basic feedback: correctness and time
- manual tagging

### V1

- multiple strategies per question
- strategy labels
- user strategy input
- basic personalization

### V2

- AI-generated solutions
- advanced insights
- adaptive learning paths
- strategy training mode

## Product Metrics

Learning metrics:

- time reduction per question
- accuracy improvement by topic
- strategy diversity increase
- reduction in slow correct answers

Behavior metrics:

- explanation review rate
- strategy switching rate over time
