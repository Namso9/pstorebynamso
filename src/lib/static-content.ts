import expressGuideJson from "../../data/express-guide.json";
import faqJson from "../../data/faq.json";
import reviewsJson from "../../data/reviews.json";

import {
  parseExpressGuideData,
  parseFaqData,
  parseReviewsData,
} from "@/services/content";

export const staticFaqData = parseFaqData(faqJson);
export const staticReviewsData = parseReviewsData(reviewsJson);
export const staticExpressGuideData = parseExpressGuideData(expressGuideJson);
