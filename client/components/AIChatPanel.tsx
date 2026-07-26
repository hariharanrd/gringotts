import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Send,
  Maximize2,
  Trash2,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Zap,
  Check
} from 'lucide-react';
import { GoblinAvatar } from './GoblinAvatar';
import { GoblinConfirmationCard } from './GoblinConfirmationCard';
import { GoblinQueryResultCard } from './GoblinQueryResultCard';
import { GoblinUpdateCard } from './GoblinUpdateCard';
import { GoblinDeleteCard } from './GoblinDeleteCard';
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
import { useToast } from './ToastContext';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  profilePicture?: string;
  onTransactionSuccess?: () => void;
  onOpenFullModal?: (txData: ParsedTransaction, msgId?: string) => void;
}

import { GOBLIN_SUGGESTION_CHIPS, GOBLIN_INPUT_PLACEHOLDER } from '../constants/goblinConstants';

const SESSION_STORAGE_KEY = 'gringotts_goblin_chat_messages';

const createWelcomeMessage = (userName?: string): ChatMessage => ({
  id: 'welcome',
  role: 'assistant',
  content: getRandomGoblinGreeting(userName),
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
});

const SUGGESTION_CHIPS = GOBLIN_SUGGESTION_CHIPS;

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  isOpen,
  onClose,
  userName,
  profilePicture,
  onTransactionSuccess,
  onOpenFullModal
}) => {
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
    if (isOpen && messages.length === 0) {
      setLoading(true);
      const timer = setTimeout(() => {
        const welcome = createWelcomeMessage(userName);
        setMessages([welcome]);
        setLoading(false);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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

  // Fetch catalogue & recent transactions on open
  useEffect(() => {
    if (isOpen) {
      loadCatalogue();
    }
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

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
    if (onTransactionSuccess) {
      onTransactionSuccess();
    }
    loadCatalogue(); // Refresh recent transactions
  };

  const handleTransactionUpdated = (msgId: string, updatedId: number) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === msgId
          ? { ...msg, transactionUpdated: true, savedTransactionId: updatedId }
          : msg
      )
    );
    if (onTransactionSuccess) {
      onTransactionSuccess();
    }
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
    if (onTransactionSuccess) {
      onTransactionSuccess();
    }
    loadCatalogue();
  };

  const handleExpandToFullPage = () => {
    onClose();
    navigate('/ai-chat');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        onClick={onClose}
      />

      {/* Slide-In Drawer Panel */}
      <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] z-50 bg-white/95 dark:bg-slate-950/95 border-l border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-300">
        {/* Panel Header */}
        <header className="p-4 border-b border-slate-200 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-teal-50/60 dark:from-slate-950 dark:via-emerald-950/40 dark:to-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <GoblinAvatar size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 tracking-tight">Goblin</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  AI Vault Keeper
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Gringotts Wizarding Financial Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Clear ledger */}
            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              title="Clear ledger history"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Expand to full page (hidden on mobile) */}
            <button
              onClick={handleExpandToFullPage}
              className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              title="Expand to Full Page Chat (/ai-chat)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Close drawer */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Thread Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => {
            const actionType = msg.goblinAction?.action_type;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <GoblinAvatar size="sm" className="mt-1 shrink-0" animateHover={false} />
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-tr-none shadow-md shadow-emerald-950/20 dark:shadow-emerald-950/40'
                      : 'bg-emerald-50/80 dark:bg-slate-900/90 border border-emerald-500/20 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm dark:shadow-lg'
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
                    className={`mt-1.5 text-[10px] ${
                      msg.role === 'user' ? 'text-emerald-200 text-right' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-1 shadow overflow-hidden border border-emerald-500/30">
                    {userDp ? (
                      <img src={userDp} alt="User DP" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking animation indicator */}
          {loading && (
            <div className="flex gap-3 justify-start animate-in fade-in duration-200">
              <GoblinAvatar size="sm" className="mt-1" animateHover={false} />
              <div className="bg-emerald-50/80 dark:bg-slate-900 border border-emerald-500/30 rounded-2xl rounded-tl-none p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="italic text-[11px] text-slate-500 dark:text-slate-400">Goblin is scritching in ledger...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length < 4 && !loading && (
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-900 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white text-[11px] transition-all shrink-0"
              >
                ⚡ {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <footer className="p-3 border-t border-slate-200 dark:border-slate-900 bg-slate-50/80 dark:bg-slate-950 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={GOBLIN_INPUT_PLACEHOLDER}
              disabled={loading}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white disabled:opacity-40 transition-all shadow-md shadow-emerald-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </footer>
      </aside>
    </>
  );
};
