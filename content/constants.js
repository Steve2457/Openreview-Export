(() => {
  const ns = (window.__OR_EXPORT__ = window.__OR_EXPORT__ || {});

  ns.SHORT_FIELD_HINTS =
    /^(rating|overall_rating|recommendation|overall_recommendation|confidence|reviewer_confidence|score|overall_score|soundness|correctness|technical_quality|novelty|originality|significance|relevance|clarity|quality|impact|reproducibility|presentation|contribution|technical_novelty|empirical_novelty|ethics|datasets|code_of_conduct|flag_for_ethics|first_time|withdraw|desk_reject)$/i;

  ns.BODY_FIELD_ORDER = [
    'summary',
    'paper_summary',
    'review_summary',
    'summary_of_the_work',
    'summary_and_contributions',
    'summary_of_contributions',
    'summary_of_the_paper',
    'review',
    'main_review',
    'detailed_review',
    'metareview',
    'overall_assessment',
    'assessment',
    'strengths',
    'strengths_and_weaknesses',
    'weaknesses',
    'weaknesses_and_questions',
    'questions',
    'pros_and_cons',
    'comments_to_authors',
    'main_comments',
    'detailed_comments',
    'justification',
    'requested_changes',
    'limitations',
    'limitation',
    'broader_impact_concerns',
    'ethical_concerns',
    'ethics_concerns',
    'societal_impact',
    'rebuttal',
    'general_comment',
    'confidential_comments',
    'confidential_comments_to_area_chair',
    'details_of_ethics_concerns',
    'flag_for_ethics_review',
    'ethics_review',
  ];

  ns.OMIT_FIELD_KEYS = new Set([
    'title',
    'authors',
    'authorids',
    'pdf',
    'submission_number',
    'venue',
    'venueid',
  ]);

  ns.BUTTON_ROOT_ID = 'or-export-reviews-root';
  ns.ROUTE_CHANGE_EVENT = 'or-export-route-change';
})();
