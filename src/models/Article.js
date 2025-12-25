const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    _id: String,
    article_number: String,
    title: String,
    part: String,
    chapter: String,
    original_text: String,
    simplified_explanation: String,
    purpose_and_intent: String,
    clauses_breakdown: [
      {
        clause: String,
        explanation: String,
      },
    ],
    amendments: [
      {
        amendment_act: String,
        year: String,
        what_changed: String,
        impact: String,
      },
    ],
    key_judicial_interpretations: [
      {
        case_name: String,
        year: String,
        court: String,
        judgement_summary: String,
        key_points: [String],
        impact: String,
      },
    ],
    practical_examples: [String],
    related_articles: [String],
    keywords: [String],
  },
  {
    collection: "Articles-const",
    timestamps: true,
  }
);

// Create the model
const Article = mongoose.model("Article", articleSchema);

module.exports = Article;
