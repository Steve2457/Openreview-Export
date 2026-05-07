(() => {
  const ns = (window.__OR_EXPORT__ = window.__OR_EXPORT__ || {});

  ns.SHORT_FIELD_HINTS =
    /^(rating|recommendation|confidence|score|soundness|presentation|contribution|correctness|technical_novelty|empirical_novelty|ethics|datasets|code_of_conduct|flag_for_ethics|first_time|withdraw|desk_reject)$/i;

  ns.BODY_FIELD_ORDER = [
    'summary',
    'review',
    'main_review',
    'strengths',
    'weaknesses',
    'questions',
    'limitations',
    'limitation',
    'rebuttal',
    'general_comment',
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
