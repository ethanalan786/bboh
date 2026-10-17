"use client";

import {
  useState,
  useRef,
  useEffect,
  useId,
  useMemo,
  useCallback,
  type ChangeEvent,
} from "react";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = root.classList.contains("dark") ? "dark" : "light";
    setTheme(initialTheme);

    const observer = new MutationObserver(() => {
      const newTheme = root.classList.contains("dark") ? "dark" : "light";
      setTheme(newTheme);
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function GooeyFilter({
  filterId,
  blur,
}: {
  filterId: string;
  blur: number;
}) {
  return (
    <svg className="absolute hidden h-0 w-0" aria-hidden>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

function SearchIcon({ layoutId, theme }: { layoutId: string; theme: "light" | "dark" }) {
  const strokeColor = theme === "light" ? "black" : "white";
  return (
    <motion.svg
      layoutId={layoutId}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      className="size-4 shrink-0"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </motion.svg>
  );
}

const transition = {
  duration: 0.4,
  type: "spring" as const,
  bounce: 0.25,
};

const iconBubbleVariants = {
  collapsed: { scale: 0, opacity: 0 },
  expanded: { scale: 1, opacity: 1 },
};

export interface GooeyInputClassNames {
  root?: string;
  filterWrap?: string;
  buttonRow?: string;
  trigger?: string;
  input?: string;
  bubble?: string;
  bubbleSurface?: string;
  results?: string;
  resultItem?: string;
  resultItemActive?: string;
}

export interface SearchResult<T = any> {
  id: string | number;
  label: string;
  data?: T;
}

export interface GooeyInputProps<T = any> {
  placeholder?: string;
  className?: string;
  classNames?: GooeyInputClassNames;
  /** Collapsed control width in px */
  collapsedWidth?: number;
  /** Expanded control width in px */
  expandedWidth?: number;
  /** Horizontal offset when expanded (px), aligns detached bubble */
  expandedOffset?: number;
  /** Gaussian blur amount for the gooey SVG filter */
  gooeyBlur?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** Search results to display as autocomplete suggestions */
  searchResults?: SearchResult<T>[];
  /** Called when a search result is selected */
  onResultSelect?: (result: SearchResult<T>) => void;
  /** Custom render function for search results */
  renderResult?: (result: SearchResult<T>) => React.ReactNode;
  /** Minimum characters before showing results */
  minSearchLength?: number;
  /** Custom filter function for search results */
  filterFunction?: (result: SearchResult<T>, searchQuery: string) => boolean;
  /** Server-side search function - async function that fetches results from API */
  onServerSearch?: (query: string) => Promise<SearchResult<T>[]>;
  /** Debounce delay for server-side search in milliseconds */
  searchDebounce?: number;
  /** Loading state for server-side search */
  isLoading?: boolean;
}

export function GooeyInput<T = any>({
  placeholder = "Type to search...",
  className,
  classNames,
  collapsedWidth = 350,
  expandedWidth = 500,
  expandedOffset = 50,
  gooeyBlur = 5,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onOpenChange,
  disabled = false,
  searchResults = [],
  onResultSelect,
  renderResult,
  minSearchLength = 2,
  filterFunction,
  onServerSearch,
  searchDebounce = 300,
  isLoading: externalLoading = false,
}: GooeyInputProps<T>) {
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const filterId = `gooey-filter-${safeId}`;
  const iconLayoutId = `gooey-input-icon-${safeId}`;
  const inputLayoutId = `gooey-input-field-${safeId}`;
  const theme = useTheme();

  const inputRef = useRef<HTMLInputElement>(null);
  const prevExpandedRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const [serverResults, setServerResults] = useState<SearchResult<T>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isControlled = valueProp !== undefined;
  const searchText = isControlled ? valueProp : uncontrolledValue;
  const useServerSearch = !!onServerSearch;

  // Server-side search with debouncing
  useEffect(() => {
    if (!useServerSearch) return;

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if query is too short
    if (!searchText || searchText.length < minSearchLength) {
      setServerResults([]);
      setIsSearching(false);
      return;
    }

    // Set loading state
    setIsSearching(true);

    // Debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await onServerSearch(searchText);
        setServerResults(results);
      } catch (error) {
        console.error('Server search error:', error);
        setServerResults([]);
      } finally {
        setIsSearching(false);
      }
    }, searchDebounce);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText, minSearchLength, searchDebounce, onServerSearch, useServerSearch]);

  // Filter search results based on input (client-side)
  const filteredResults = useMemo(() => {
    // Use server results if available, otherwise filter client-side results
    const resultsToFilter = useServerSearch ? serverResults : searchResults;
    
    if (!searchText || searchText.length < minSearchLength) return [];
    
    // If using server search, return results as-is (server already filtered)
    if (useServerSearch) {
      return resultsToFilter;
    }
    
    // Client-side filtering
    const searchLower = searchText.toLowerCase();

    return resultsToFilter.filter(result => {
      if (filterFunction) {
        return filterFunction(result, searchText);
      }
      // Default filter: search in label and data fields
      const labelMatch = (result.label?.toLowerCase() || "").includes(searchLower);
      const dataMatch = result.data && typeof result.data === 'object'
        ? Object.values(result.data).some((value: any) =>
            value && typeof value === 'string' && value.toLowerCase().includes(searchLower)
          )
        : false;
      return labelMatch || dataMatch;
    });
  }, [searchText, searchResults, serverResults, minSearchLength, filterFunction, useServerSearch]);

  // Show results when we have filtered results and input is expanded
  useEffect(() => {
    const hasResults = filteredResults.length > 0;
    const shouldShowLoading = useServerSearch && isSearching && searchText.length >= minSearchLength;
    setShowResults(isExpanded && (hasResults || shouldShowLoading));
    setSelectedIndex(-1);
  }, [isExpanded, filteredResults, isSearching, searchText, minSearchLength, useServerSearch]);

  const setSearchText = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const setExpanded = useCallback(
    (next: boolean) => {
      setIsExpanded(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    } else if (prevExpandedRef.current && !useServerSearch) {
      // Only clear search text on collapse for client-side search
      setSearchText("");
    }
    prevExpandedRef.current = isExpanded;
  }, [isExpanded, setSearchText, useServerSearch]);

  // Clear server results when input is collapsed
  useEffect(() => {
    if (!isExpanded && useServerSearch) {
      setServerResults([]);
      setIsSearching(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [isExpanded, useServerSearch]);

  const buttonVariants = useMemo(
    () => ({
      collapsed: { width: collapsedWidth, marginLeft: 0 },
      expanded: { width: expandedWidth, marginLeft: expandedOffset },
    }),
    [collapsedWidth, expandedWidth, expandedOffset],
  );

  const handleExpand = useCallback(() => {
    if (!disabled) setExpanded(true);
  }, [disabled, setExpanded]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [setSearchText],
  );

  const handleBlur = useCallback(() => {
    // Delay hiding results to allow for result selection
    setTimeout(() => {
      if (!searchText) setExpanded(false);
      setShowResults(false);
    }, 200);
  }, [searchText, setExpanded]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || filteredResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : -1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
          onResultSelect?.(filteredResults[selectedIndex]);
          setSearchText(filteredResults[selectedIndex].label);
          setShowResults(false);
        }
        break;
      case 'Escape':
        setShowResults(false);
        break;
    }
  }, [showResults, filteredResults, selectedIndex, onResultSelect, setSearchText]);

  const handleResultClick = useCallback((result: SearchResult<T>) => {
    onResultSelect?.(result);
    setSearchText(result.label);
    setShowResults(false);
    setExpanded(false);
    // Clear server results when a result is selected
    if (useServerSearch) {
      setServerResults([]);
    }
  }, [onResultSelect, setSearchText, setExpanded, useServerSearch]);

  const surfaceClass =
    "bg-background text-foreground shadow-sm";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        className,
        classNames?.root,
      )}
    >
      <GooeyFilter filterId={filterId} blur={gooeyBlur} />

      <div
        className={cn(
          "relative flex h-10 items-center justify-center",
          classNames?.filterWrap,
        )}
        style={{ filter: `url(#${filterId})` }}
      >
        <motion.div
          className={cn("flex h-10 items-center justify-center", classNames?.buttonRow)}
          variants={buttonVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={handleExpand}
            className={cn(
              "flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-sm font-medium outline-none transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
              surfaceClass,
              classNames?.trigger,
            )}
          >
            {!isExpanded ? (
              <SearchIcon theme={theme} layoutId={iconLayoutId} />
            ) : null}
            <motion.input
              layoutId={inputLayoutId}
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              value={searchText}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              disabled={disabled || !isExpanded}
              placeholder={placeholder}
              className={cn(
                "h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none",
                isExpanded
                  ? "placeholder:text-foreground/50"
                  : "pointer-events-none placeholder:text-foreground/80",
                "dark:placeholder:text-[#a2a8aa]",
                classNames?.input,
              )}
            />
          </button>
        </motion.div>

        <motion.div
          className={cn(
            "absolute top-1/2 left-0 flex size-10 -translate-y-1/2 items-center justify-center",
            classNames?.bubble,
          )}
          variants={iconBubbleVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              surfaceClass,
              classNames?.bubbleSurface,
            )}
          >
            <SearchIcon theme={theme} layoutId={iconLayoutId} />
          </div>
        </motion.div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto rounded-lg shadow-lg",
              surfaceClass,
              classNames?.results,
            )}
          >
            {isSearching && useServerSearch ? (
              <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Searching...
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              filteredResults.map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    index === selectedIndex && "bg-gray-100 dark:bg-gray-800",
                    classNames?.resultItem,
                    index === selectedIndex && classNames?.resultItemActive,
                  )}
                >
                  {renderResult ? renderResult(result) : result.label}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
