const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const parserPath = path.join(__dirname, '..', 'content', 'review-parser.js');
const context = {
  URLSearchParams,
  window: {
    __OR_EXPORT__: {
      OMIT_FIELD_KEYS: new Set(),
      labelToKey(label) {
        return String(label)
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
      },
      extractTextWithMath(element) {
        return element.innerText || element.textContent || '';
      },
    },
    location: { hostname: 'openreview.net', pathname: '/forum', search: '?id=paper' },
  },
};
context.window.window = context.window;
vm.runInNewContext(fs.readFileSync(parserPath, 'utf8'), context, { filename: parserPath });

const ns = context.window.__OR_EXPORT__;

function fakeNote({
  replyType = '',
  heading = '',
  signature = '',
  invitationId = '',
  fields = [],
  noteId = 'note-1',
}) {
  const invitation = replyType ? { innerText: replyType } : null;
  const headingElement = heading ? { innerText: heading } : null;
  const signatureElement = signature ? { innerText: signature } : null;
  const invitationLink = invitationId
    ? {
        getAttribute(name) {
          return name === 'href' ? invitationId : null;
        },
      }
    : null;
  const rows = fields.map(({ label, value }) => ({
    innerText: `${label}: ${value}`,
    querySelector(selector) {
      if (selector === '.note-content-field') return { textContent: `${label}:` };
      if (selector === '.note-content-value') return { innerText: value };
      return null;
    },
  }));
  const contentRoot = rows.length
    ? {
        querySelectorAll(selector) {
          return selector === ':scope > div, :scope > li' ? rows : [];
        },
      }
    : null;

  return {
    getAttribute(name) {
      return name === 'data-id' ? noteId : null;
    },
    querySelectorAll(selector) {
      if (selector.includes('a[href*="Review"]') && invitationLink) return [invitationLink];
      return [];
    },
    querySelector(selector) {
      if (selector.includes('.subheading .invitation')) return invitation;
      if (selector === '.heading h4, .heading .minimal-title') return headingElement;
      if (selector === '.heading .minimal-title') return null;
      if (selector === '.subheading .signatures, .heading .signatures') {
        return signatureElement;
      }
      if (selector.startsWith(':scope > .note-content-container')) return contentRoot;
      return null;
    },
  };
}

test('recognizes TMLR Review reply type without score fields', () => {
  const note = fakeNote({
    replyType: 'Review',
    signature: 'by TMLR/Paper8669/AnonReviewer_XYZ',
    fields: [
      { label: 'Summary of Contributions', value: 'This paper introduces...' },
      { label: 'Strengths and Weaknesses', value: 'Strong idea; limited evaluation.' },
      { label: 'Requested Changes', value: 'Clarify section 3.' },
    ],
  });

  assert.equal(ns.isReviewNoteElement(note), true);
});

test('recognizes legacy and meta review reply types', () => {
  assert.equal(ns.isReviewReplyTypeText('Official Review'), true);
  assert.equal(ns.isReviewReplyTypeText('Meta_Review'), true);
  assert.equal(ns.isReviewReplyTypeText('Ethics Review Form'), true);
  assert.equal(ns.isReviewReplyTypeText('External Reviewer Report'), true);
  assert.equal(ns.isReviewReplyTypeText('Official Assessment'), true);
  assert.equal(
    ns.isReviewNoteElement(fakeNote({ invitationId: '/invitation?id=Venue/-/Official_Review' })),
    true,
  );
});

test('does not treat review workflow controls or author replies as reviews', () => {
  assert.equal(ns.isReviewReplyTypeText('Review Approval'), false);
  assert.equal(ns.isReviewReplyTypeText('Review Revision'), false);
  assert.equal(ns.isReviewReplyTypeText('Review Rating'), false);
  assert.equal(ns.isReviewReplyTypeText('Response to Official Review'), false);
  assert.equal(ns.isReviewReplyTypeText('Author Response'), false);
  assert.equal(ns.isReviewNoteElement(fakeNote({ replyType: 'Comment' })), false);
});

test('matches broad review names while excluding workflow notes', () => {
  assert.equal(ns.isReviewReplyTypeText('Review'), true);
  assert.equal(ns.isReviewReplyTypeText('Review of Paper 8669'), true);
  assert.equal(ns.isReviewReplyTypeText('Official Review of Submission 42'), true);
  assert.equal(ns.isReviewReplyTypeText('Secondary Review'), true);
  assert.equal(ns.isReviewReplyTypeText('Paper Review Form'), true);
  assert.equal(ns.isReviewReplyTypeText('Review Approval'), false);
  assert.equal(ns.isReviewReplyTypeText('Review Request'), false);
  assert.equal(ns.isReviewReplyTypeText('Review Process Status'), false);
  assert.equal(ns.isReviewReplyTypeText('Review Submission'), false);
  assert.equal(ns.isReviewInvitationId('Venue/Paper1/-/Ethics_Review'), true);
  assert.equal(ns.isReviewInvitationId('Venue/Paper1/-/Review_Revision'), false);
});

test('recognizes a custom-named review from reviewer signature and fields', () => {
  const note = fakeNote({
    replyType: 'Assessment',
    signature: 'by Venue/Paper42/Referee_A1',
    fields: [
      { label: 'Overall Assessment', value: 'The contribution is technically sound.' },
      { label: 'Justification', value: 'Detailed evidence follows.' },
    ],
  });

  assert.equal(ns.isReviewNoteElement(note), true);

  const programCommitteeNote = fakeNote({
    replyType: 'Assessment',
    signature: 'by Venue/Program_Committee_Member_17',
    fields: [{ label: 'Summary', value: 'A concise assessment.' }],
  });
  assert.equal(ns.isReviewNoteElement(programCommitteeNote), true);
});

test('does not confuse review ratings, decisions, or reviewer comments with reports', () => {
  const reviewRating = fakeNote({
    replyType: 'Review Rating',
    signature: 'by Venue/Area_Chair_A1',
    fields: [{ label: 'Rating', value: 'Excellent review' }],
  });
  const decision = fakeNote({
    replyType: 'Decision',
    signature: 'by Venue/Area_Chair_A1',
    fields: [
      { label: 'Decision', value: 'Accept' },
      { label: 'Comment', value: 'The reviews are positive.' },
    ],
  });
  const reviewerComment = fakeNote({
    replyType: 'Comment',
    heading: 'Official Review',
    signature: 'by Venue/Paper42/Reviewer_A1',
    fields: [{ label: 'Comment', value: 'Thanks for the clarification.' }],
  });

  assert.equal(ns.isReviewNoteElement(reviewRating), false);
  assert.equal(ns.isReviewNoteElement(decision), false);
  assert.equal(ns.isReviewNoteElement(reviewerComment), false);
});

test('extracts fields from both current div rows and legacy list rows', () => {
  const note = fakeNote({
    replyType: 'Official Review',
    fields: [
      { label: 'Summary', value: 'Summary text' },
      { label: 'Confidence', value: '4: confident' },
      { label: '给作者的意见', value: '请补充消融实验。' },
    ],
  });

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        ns.extractFieldsFromNoteContent(note).map(({ label, text }) => ({ label, text })),
      ),
    ),
    [
      { label: 'Summary', text: 'Summary text' },
      { label: 'Confidence', text: '4: confident' },
      { label: '给作者的意见', text: '请补充消融实验。' },
    ],
  );
});

test('extracts an ethics review through the complete DOM parsing path', () => {
  const ethicsReview = fakeNote({
    replyType: 'Ethics Review Form',
    signature: 'by Venue/Paper7/Ethics_Reviewer_A1',
    noteId: 'ethics-review-7',
    fields: [
      { label: 'Recommendation', value: '2: Ethical issues need to be addressed' },
      { label: 'Ethics Concerns', value: 'The consent process needs clarification.' },
    ],
  });
  context.document = {
    querySelectorAll(selector) {
      return selector.includes('.note[data-id]') ? [ethicsReview] : [];
    },
  };
  ns.getPaperTitleFromDom = () => 'Test Paper';

  const parsed = JSON.parse(JSON.stringify(ns.extractOfficialReviewsFromDom()));
  assert.equal(parsed.paperTitle, 'Test Paper');
  assert.equal(parsed.reviews.length, 1);
  assert.equal(parsed.reviews[0].noteId, 'ethics-review-7');
  assert.equal(parsed.reviews[0].fields[1].label, 'Ethics Concerns');
});
