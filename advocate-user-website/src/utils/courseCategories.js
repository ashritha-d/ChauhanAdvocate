// The 3 fixed learning-portal categories. Single source of truth for the landing
// page cards, category listing headers, and the enroll-button label per category.
export const COURSE_CATEGORIES = {
  internship: {
    key: 'internship',
    title: 'Internship Program for LL.B Students',
    shortTitle: 'Internship Program',
    icon: 'fas fa-user-graduate',
    description: 'Practical legal internship program designed for LL.B students to gain real-world legal experience.',
    buttonLabel: 'Enroll Now',
  },
  training: {
    key: 'training',
    title: 'Training Program for Junior Advocates',
    shortTitle: 'Training Program',
    icon: 'fas fa-briefcase',
    description: 'Professional legal training for newly enrolled advocates to improve drafting, court practice, litigation, and client handling.',
    buttonLabel: 'Join Training',
  },
  judiciary: {
    key: 'judiciary',
    title: 'Judiciary Exam Preparation',
    shortTitle: 'Judiciary Prep',
    icon: 'fas fa-gavel',
    description: 'Comprehensive preparation for Junior Civil Judge and Judiciary competitive examinations.',
    buttonLabel: 'Start Learning',
  },
};

export const COURSE_CATEGORY_LIST = Object.values(COURSE_CATEGORIES);

// Per-category labels for the generic `resources[]` array on Course, so the same
// underlying data reads naturally under each program's own vocabulary.
export const RESOURCE_LABELS_BY_CATEGORY = {
  internship: { study_material: 'Study Materials', assignment: 'Assignments' },
  training: { study_material: 'Downloadable Materials', case_study: 'Case Studies' },
  judiciary: { study_material: 'PDF Notes', mock_test: 'Mock Tests', previous_paper: 'Previous Papers' },
};

export const RESOURCE_TYPE_LABELS = {
  study_material: 'Study Material',
  assignment: 'Assignment',
  case_study: 'Case Study',
  previous_paper: 'Previous Paper',
  mock_test: 'Mock Test',
};
