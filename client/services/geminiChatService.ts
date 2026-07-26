import { GoogleGenAI } from "@google/genai";
import {
  Category,
  SubCategory,
  Item,
  CreditCard,
  Transaction,
  GoblinParseResult
} from "../types";
import { api } from "./api";

export const GOBLIN_GREETINGS = [
  "Greetings, Wizard {NAME}! *scritch scritch in ledger* Welcome to Gringotts! My quill is freshly dipped in dragon-ink. What gold has left or entered your pouch today?",
  "Ah, welcome back to the Vault Chamber, Wizard {NAME}! *adjusts spectacles and taps brass scale* Tell me your transactions, and I shall log them into the high-security ledger!",
  "Halt! Who approaches the Gringotts ledger? Ah, 'tis you, Wizard {NAME}! *flips heavy parchment page* State your gold spent, earned, or saved, and I shall record every single copper.",
  "*scritch scritch* Ah, Wizard {NAME}! The vault doors are open. Did you spend coins on treats, pay a bill, or deposit gold into savings today? Speak, and I shall calculate!",
  "By order of Gringotts Vaults! *polishes gold coin on sleeve* Greetings, Wizard {NAME}! Tell me your financial deeds, search your records, or amend an entry!",
  "Welcome, Wizard {NAME}! *inspects balance sheet with magnifying glass* Ready to audit your pouch? Tell me what you spent or received, and I'll keep your vault in order!",
  "Ah, more business for the Gringotts ledger, Wizard {NAME}! *opens iron-bound book* Whether you spent 500 on pizza or deposited salary into savings, state it clearly for the record!",
  "Greetings, Wizard {NAME}! *chortles softly* The vault scales are balanced and ready. Tell me what gold moved today!"
];

import { GOBLIN_CAPABILITIES_TEXT } from "../constants/goblinConstants";
export { GOBLIN_CAPABILITIES_TEXT };

export const getRandomGoblinGreeting = (userName?: string): string => {
  const nameToUse = userName && userName.trim() ? userName.trim() : 'Wizard';
  const index = Math.floor(Math.random() * GOBLIN_GREETINGS.length);
  return GOBLIN_GREETINGS[index].replace(/\{NAME\}/g, nameToUse) + GOBLIN_CAPABILITIES_TEXT;
};

export const getSubCategoryCategoryId = (s: any): number | undefined => {
  if (!s) return undefined;
  if (typeof s.categoryId === 'number') return s.categoryId;
  if (typeof s.category?.id === 'number') return s.category.id;
  if (typeof s.category === 'number') return s.category;
  if (typeof s.category_id === 'number') return s.category_id;
  return undefined;
};

export const getItemSubCategoryId = (i: any): number | undefined => {
  if (!i) return undefined;
  if (typeof i.subCategoryId === 'number') return i.subCategoryId;
  if (typeof i.subcategory?.id === 'number') return i.subcategory.id;
  if (typeof i.subCategory?.id === 'number') return i.subCategory.id;
  if (typeof i.subcategory === 'number') return i.subcategory;
  if (typeof i.sub_category_id === 'number') return i.sub_category_id;
  return undefined;
};

export const parseTransactionWithGoblin = async (
  userMessage: string,
  _categories: Category[] = [],
  _subCategories: SubCategory[] = [],
  _items: Item[] = [],
  _creditCards: CreditCard[] = [],
  _recentTransactions: Transaction[] = [],
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<GoblinParseResult> => {
  try {
    return await api.parseTransactionWithGoblin(userMessage, chatHistory);
  } catch (error: any) {
    console.error("Goblin AI Parse Error:", error);
    const errString = String(error?.message || error || '');
    if (errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED') || errString.includes('quota')) {
      const errResp = "*grumbles loudly* Bah! Gemini API Quota is exhausted (HTTP 429)! Check server configuration.";
      return {
        goblinResponse: errResp,
        actionPayload: { action_type: 'CONVERSATIONAL', goblin_response: errResp }
      };
    }
    const fallbackMsg = "*adjusts spectacles in confusion* Blasted quill slipped! I couldn't process that entry properly, wizard. Try again?";
    return {
      goblinResponse: fallbackMsg,
      actionPayload: { action_type: 'CONVERSATIONAL', goblin_response: fallbackMsg }
    };
  }
};
