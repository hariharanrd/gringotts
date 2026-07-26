import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Trash2,
  Sparkles,
  User,
  Zap,
  Bot,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Coins
} from 'lucide-react';
import { GoblinAvatar } from '../components/GoblinAvatar';
import { GoblinConfirmationCard } from '../components/GoblinConfirmationCard';
import { GoblinQueryResultCard } from '../components/GoblinQueryResultCard';
import { GoblinUpdateCard } from '../components/GoblinUpdateCard';
import { GoblinDeleteCard } from '../components/GoblinDeleteCard';
import { parseTransactionWithGoblin, getRandomGoblinGreeting } from '../services/geminiChatService';
import { api } from '../services/api';
import {
  ChatMessage,
  Category,
  SubCategory,
  Item,
  CreditCard,
  Transaction,
  ParsedTransaction,
  TransactionType,
  TransactionSearchFilter
} from '../types';
import { useToast } from '../components/ToastContext';
import { useNavigate } from 'react-router-dom';

import { GOBLIN_SUGGESTION_CHIPS, GOBLIN_INPUT_PLACEHOLDER } from '../constants/goblinConstants';

const SESSION_STORAGE_KEY = 'gringotts_goblin_chat_messages';

const createWelcomeMessage = (userName?: string): ChatMessage => ({
  id: 'welcome',
  role: 'assistant',
  content: getRandomGoblinGreeting(userName),
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
});

const SUGGESTION_CHIPS = GOBLIN_SUGGESTION_CHIPS;

interface AIChatPageProps {
  userName?: string;
  profilePicture?: string;
  onOpenFullModal?: (txData: ParsedTransaction, msgId?: string) => void;
}

export const AIChatPage: React.FC<AIChatPageProps> = ({ userName, profilePicture, onOpenFullModal }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [userDp, setUserDp] = useState<string>(profilePicture || '');

  useEffect(() => {
    if (profilePicture) {
      setUserDp(profilePicture);
    } else {
      api.getProfile().then(p => {
        if (p && p.profilePicture) {
          setUserDp(p.profilePicture);
        }
      }).catch(() => {});
    }
  }, [profilePicture]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return [];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored && JSON.parse(stored).length > 0) {
        return false;
      }
    } catch (e) {}
    return true;
  });

  // Initial welcome message typing delay effect
  useEffect(() => {
    if (messages.length === 0) {
      setLoading(true);
      const timer = setTimeout(() => {
        const welcome = createWelcomeMessage(userName);
        setMessages([welcome]);
        setLoading(false);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, []);

  // Cached catalogue & transaction data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages]);

  // Sync messages when updated externally (e.g. from TransactionModal save)
  useEffect(() => {
    const handleChatUpdated = () => {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          setMessages(JSON.parse(stored));
        }
      } catch (e) {}
    };

    window.addEventListener('gringotts-goblin-chat-updated', handleChatUpdated);
    return () => {
      window.removeEventListener('gringotts-goblin-chat-updated', handleChatUpdated);
    };
  }, []);

  useEffect(() => {
    loadCatalogue();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadCatalogue = async () => {
    try {
      const [catData, subData, itemData, cardData, txData] = await Promise.all([
        api.getCategories(),
        api.getAllSubCategoriesPaginated(1).then(r => r.data || []).catch(() => []),
        api.getAllItemsPaginated(1).then(r => r.data || []).catch(() => []),
        api.getCreditCards().catch(() => ({ data: [] })),
        api.getTransactions(1, undefined, 'DESC', 30).catch(() => ({ data: [] }))
      ]);
      setCategories(Array.isArray(catData) ? catData : (catData as any)?.data || []);
      setSubCategories(Array.isArray(subData) ? subData : []);
      setItems(Array.isArray(itemData) ? itemData : []);
      const cardsList = Array.isArray(cardData) ? cardData : (cardData as any)?.data || [];
      setCreditCards(cardsList);
      setRecentTransactions(Array.isArray(txData.data) ? txData.data : []);
    } catch (err) {
      console.error('Failed to pre-fetch Goblin catalogue:', err);
    }
  };

  const isGenericMetaQuery = (query?: string): boolean => {
    if (!query) return true;
    const stripped = query
      .toLowerCase()
      .replace(/\b(show|list|get|find|my|recent|last|latest|past|all|transaction|transactions|expense|expenses|income|incomes|saving|savings|revolving|revolvings|history|ledger|vault|record|records|\d+)\b/g, '')
      .trim();
    return stripped.length === 0;
  };

  const extractLimit = (filter?: any): number => {
    if (filter?.limit && typeof filter.limit === 'number') return filter.limit;
    if (filter?.count && typeof filter.count === 'number') return filter.count;
    if (filter?.query) {
      const match = String(filter.query).match(/\b(\d+)\b/);
      if (match) return parseInt(match[1], 10);
    }
    return 50;
  };

  const executeLocalReadQuery = (filter?: any): Transaction[] => {
    if (!filter) return recentTransactions.slice(0, 5);
    let list = recentTransactions.filter(t => {
      if (filter.type && t.type?.toUpperCase() !== filter.type.toUpperCase()) return false;
      if (filter.category_id && t.category?.id !== filter.category_id) return false;
      if (filter.query && !isGenericMetaQuery(filter.query)) {
        const q = filter.query.toLowerCase();
        const descMatch = t.description?.toLowerCase().includes(q);
        const catMatch = t.category?.name?.toLowerCase().includes(q);
        const subCatMatch = t.subcategory?.name?.toLowerCase().includes(q);
        const itemMatch = t.item?.name?.toLowerCase().includes(q);
        if (!descMatch && !catMatch && !subCatMatch && !itemMatch) return false;
      }
      const txDate = t.transaction_time?.split('T')[0] || (t as any).createdAt?.split('T')[0];
      if (txDate) {
        if (filter.startDate && txDate < filter.startDate) return false;
        if (filter.endDate && txDate > filter.endDate) return false;
      }
      if (filter.minAmount && t.value < filter.minAmount) return false;
      if (filter.maxAmount && t.value > filter.maxAmount) return false;
      return true;
    });

    const limit = extractLimit(filter);
    if (limit > 0 && list.length > limit) {
      list = list.slice(0, limit);
    }
    return list;
  };

  const executeReadQuery = async (filter?: TransactionSearchFilter): Promise<Transaction[]> => {
    try {
      const page = filter?.page || 1;
      const size = filter?.size || 10;
      const direction = filter?.direction || 'DESC';
      const criteria = filter?.criteria || [];
      const targetApi = (filter?.target_api || filter?.type || '').toUpperCase();

      let apiPromise: Promise<any>;
      if (targetApi === 'SAVING') {
        apiPromise = api.getSavings(page, criteria, direction, size);
      } else if (targetApi === 'EXPENSE') {
        apiPromise = api.getExpenses(page, criteria, direction, size);
      } else if (targetApi === 'INCOME') {
        apiPromise = api.getIncomes(page, criteria, direction, size);
      } else if (targetApi === 'REVOLVING') {
        apiPromise = api.getRevolvings(page, criteria, direction, size);
      } else {
        apiPromise = api.getTransactions(page, criteria, direction, size);
      }

      const res = await apiPromise;
      let fetchedList: Transaction[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return fetchedList;
    } catch (e) {
      console.error('API Query error, using local fallback:', e);
      return executeLocalReadQuery(filter);
    }
  };

  const handlePrefillInput = (text: string) => {
    setInput(text);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleOpenModalForTx = (tx: Transaction) => {
    if (onOpenFullModal) {
      const parsedTx: ParsedTransaction = {
        transaction_type: tx.type,
        value: tx.value,
        description: tx.description,
        transaction_date: tx.transaction_time?.split('T')[0] || (tx as any).createdAt?.split('T')[0],
        payment_mode: tx.payment_mode,
        notes: tx.notes,
        category_id: tx.category?.id,
        category_name: tx.category?.name,
        subcategory_id: tx.subcategory?.id,
        subcategory_name: tx.subcategory?.name,
        item_id: tx.item?.id,
        item_name: tx.item?.name,
        credit_card_id: (tx as any).credit_card?.id,
        credit_card_nickname: (tx as any).credit_card?.nickname
      };
      (parsedTx as any).id = tx.id;
      onOpenFullModal(parsedTx);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const historyContext = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const parseResult = await parseTransactionWithGoblin(
        query,
        categories,
        subCategories,
        items,
        creditCards,
        recentTransactions,
        historyContext
      );

      const actionPayload = parseResult.actionPayload;
      let queryResults: Transaction[] | undefined = undefined;

      if (actionPayload.action_type === 'READ') {
        queryResults = await executeReadQuery(actionPayload.search_filter);
      } else if ((actionPayload.action_type === 'UPDATE' || actionPayload.action_type === 'DELETE') && !actionPayload.target_transaction) {
        if (actionPayload.target_transaction_id) {
          const found = recentTransactions.find(t => t.id === Number(actionPayload.target_transaction_id));
          if (found) {
            actionPayload.target_transaction = found;
          } else {
            const hasValidCriteria = actionPayload.search_filter?.criteria?.some(c => c.value && String(c.value).trim().length > 0);
            if (hasValidCriteria) {
              const queried = await executeReadQuery({
                ...actionPayload.search_filter,
                size: 1
              });
              if (queried && queried.length > 0) {
                actionPayload.target_transaction = queried[0];
                actionPayload.target_transaction_id = queried[0].id;
              }
            }
          }
        } else if (actionPayload.search_filter) {
          const hasValidCriteria = actionPayload.search_filter?.criteria?.some(c => c.value && String(c.value).trim().length > 0);
          if (hasValidCriteria) {
            const queried = await executeReadQuery({
              ...actionPayload.search_filter,
              size: 1
            });
            if (queried && queried.length > 0) {
              actionPayload.target_transaction = queried[0];
              actionPayload.target_transaction_id = queried[0].id;
            }
          }
        }

        if (!actionPayload.target_transaction) {
          actionPayload.action_type = 'CONVERSATIONAL';
          const verb = parseResult.actionPayload.action_type === 'DELETE' ? 'delete' : 'update';
          const filterVal = actionPayload.search_filter?.criteria?.find(c => c.value && String(c.value).trim().length > 0)?.value;
          const targetDesc = filterVal ? `'${filterVal}'` : 'your query';
          parseResult.goblinResponse = `*adjusts spectacles* I searched the Gringotts ledger, wizard, but found no transaction matching ${targetDesc} to ${verb}. No entry was modified.`;
        }
      }

      const goblinMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: parseResult.goblinResponse,
        parsedTransaction: actionPayload.parsed_transaction,
        goblinAction: actionPayload,
        queryResults,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, goblinMsg]);
    } catch (err) {
      console.error('Goblin response error:', err);
      const errorMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: "*scritch scritch* Blasted ink spilled! I encountered an error checking the vault ledger. Please try again!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {}
    setMessages([]);
    setLoading(true);
    showToast('Goblin ledger cleared', 'info');
    setTimeout(() => {
      const freshWelcome = createWelcomeMessage(userName);
      setMessages([freshWelcome]);
      setLoading(false);
    }, 750);
  };

  const handleTransactionSuccess = (msgId: string, savedId: number) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === msgId
          ? { ...msg, transactionSaved: true, savedTransactionId: savedId }
          : msg
      )
    );
    loadCatalogue();
  };

  const handleTransactionUpdated = (msgId: string, updatedId: number) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === msgId
          ? { ...msg, transactionUpdated: true, savedTransactionId: updatedId }
          : msg
      )
    );
    loadCatalogue();
  };

  const handleTransactionDeleted = (msgId: string, deletedId: number) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === msgId
          ? { ...msg, transactionDeleted: true, savedTransactionId: deletedId }
          : msg
      )
    );
    loadCatalogue();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4 pb-4 sm:pb-12 px-1 sm:px-0">
      {/* Header Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 border border-emerald-500/30 p-3.5 sm:p-6 overflow-hidden shadow-xl shadow-emerald-950/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20" />
        <div className="relative z-10 flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <GoblinAvatar size="md" className="sm:hidden" />
            <GoblinAvatar size="xl" className="hidden sm:inline-flex" />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-amber-200 to-teal-300 tracking-tight">
                  Goblin - AI Assistant
                </h1>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                  AI Assistant
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 max-w-xl hidden sm:block">
                Log, search, update, or erase transactions using natural language. Goblin will inspect your vault ledger and present confirmation cards before executing actions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900 text-xs font-semibold transition-all"
              title="Clear Ledger History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Chamber Window */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-emerald-500/20 shadow-xl dark:shadow-2xl flex flex-col h-[calc(100vh-190px)] sm:h-[680px] min-h-[460px] overflow-hidden backdrop-blur-xl">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {messages.map(msg => {
            const actionType = msg.goblinAction?.action_type;

            return (
              <div
                key={msg.id}
                className={`flex gap-2 sm:gap-4 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <>
                    <GoblinAvatar size="sm" className="mt-1 shrink-0 sm:hidden" animateHover={false} />
                    <GoblinAvatar size="md" className="mt-1 shrink-0 hidden sm:inline-flex" animateHover={false} />
                  </>
                )}

                <div
                  className={`max-w-[92%] sm:max-w-[80%] rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-tr-none shadow-md shadow-emerald-950/20 dark:shadow-emerald-950/40'
                      : 'bg-emerald-50/70 dark:bg-slate-900/90 border border-emerald-500/20 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm dark:shadow-lg'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Render CREATE confirmation card */}
                  {(actionType === 'CREATE' || (!actionType && msg.parsedTransaction)) && msg.parsedTransaction && (
                    <GoblinConfirmationCard
                      msgId={msg.id}
                      parsedTx={msg.parsedTransaction}
                      categories={categories}
                      subCategories={subCategories}
                      items={items}
                      creditCards={creditCards}
                      isAlreadySaved={msg.transactionSaved}
                      savedTransactionId={msg.savedTransactionId}
                      onSuccess={savedId => handleTransactionSuccess(msg.id, savedId)}
                      onOpenFullModal={(txData, targetMsgId) => {
                        if (onOpenFullModal) {
                          onOpenFullModal(txData, targetMsgId || msg.id);
                        } else {
                          showToast('Use the confirmation card fields above to edit & submit!', 'info');
                        }
                      }}
                    />
                  )}

                  {/* Render READ query results card */}
                  {actionType === 'READ' && msg.queryResults && (
                    <GoblinQueryResultCard
                      transactions={msg.queryResults}
                      filterSummary={msg.goblinAction?.search_filter?.query || msg.goblinAction?.search_filter?.type}
                      onOpenModal={tx => handleOpenModalForTx(tx)}
                      onSelectForUpdate={tx => handlePrefillInput(`Update tx #${tx.id}: Change description to "${tx.description}", amount to ${tx.value}`)}
                      onSelectForDelete={tx => handlePrefillInput(`Delete tx #${tx.id}`)}
                    />
                  )}

                  {/* Render UPDATE confirmation card */}
                  {actionType === 'UPDATE' && msg.goblinAction?.target_transaction && (
                    <GoblinUpdateCard
                      targetTx={msg.goblinAction.target_transaction}
                      updateFields={msg.goblinAction.update_fields || msg.goblinAction.parsed_transaction}
                      isAlreadyUpdated={msg.transactionUpdated}
                      onSuccess={updatedId => handleTransactionUpdated(msg.id, updatedId)}
                    />
                  )}

                  {/* Render DELETE confirmation card */}
                  {actionType === 'DELETE' && msg.goblinAction?.target_transaction && (
                    <GoblinDeleteCard
                      targetTx={msg.goblinAction.target_transaction}
                      isAlreadyDeleted={msg.transactionDeleted}
                      onSuccess={deletedId => handleTransactionDeleted(msg.id, deletedId)}
                    />
                  )}

                  <div
                    className={`mt-1.5 sm:mt-2 text-[10px] ${
                      msg.role === 'user' ? 'text-emerald-200 text-right' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-700 text-white font-bold flex items-center justify-center text-xs sm:text-sm shrink-0 mt-1 shadow-lg overflow-hidden border border-emerald-500/30">
                    {userDp ? (
                      <img src={userDp} alt="User DP" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2 sm:gap-4 justify-start animate-in fade-in duration-200">
              <GoblinAvatar size="sm" className="mt-1 sm:hidden" animateHover={false} />
              <GoblinAvatar size="md" className="mt-1 hidden sm:inline-flex" animateHover={false} />
              <div className="bg-emerald-50/70 dark:bg-slate-900 border border-emerald-500/30 rounded-2xl sm:rounded-3xl rounded-tl-none p-3 sm:p-4 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5 sm:gap-3">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="italic text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Goblin is inspecting the Gringotts ledger...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {!loading && (
          <div className="px-3 sm:px-6 py-2 border-t border-slate-200/80 dark:border-slate-900/80 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white text-xs font-medium transition-all shrink-0"
              >
                ⚡ {chip}
              </button>
            ))}
          </div>
        )}

        {/* Footer Input Bar */}
        <footer className="p-2.5 sm:p-4 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={GOBLIN_INPUT_PLACEHOLDER}
              disabled={loading}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm disabled:opacity-40 transition-all shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/50 flex items-center justify-center gap-1.5 sm:gap-2 shrink-0"
            >
              <span className="hidden sm:inline">Send to Vault</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default AIChatPage;
