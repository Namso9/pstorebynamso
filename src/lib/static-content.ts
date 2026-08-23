import bioscopeDownloadJson from "../../data/bioscope-download.json";
import expressGuideJson from "../../data/express-guide.json";
import faqJson from "../../data/faq.json";
import reviewsJson from "../../data/reviews.json";

import {
  parseBioscopeDownloadData,
  parseExpressGuideData,
  parseFaqData,
  parseReviewsData,
} from "@/services/content";

export const staticFaqData = parseFaqData(faqJson);
export const staticReviewsData = parseReviewsData(reviewsJson);
export const staticExpressGuideData = parseExpressGuideData(expressGuideJson);
export const staticBioscopeDownloadData =
  parseBioscopeDownloadData(bioscopeDownloadJson);
