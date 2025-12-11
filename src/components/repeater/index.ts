/**
 * Repeater components module
 *
 * Provides components for displaying repeater details, including:
 * - Main RepeaterDetails orchestrating component
 * - Section components for specific data (frequency, location, etc.)
 * - Community voting subsystem
 * - Reusable UI components (SectionCard, InfoCard, ShareButton)
 * - Custom hooks for voting state management
 * - Utility functions for formatting and status configuration
 */

// Types
export * from "./types";

// Utils
export * from "./utils/formatters";
export * from "./utils/statusConfig";

// Hooks
export { useLocalVote } from "./hooks/useLocalVote";
export { useCommunityVoting } from "./hooks/useCommunityVoting";

// Main component (default export for backward compatibility)
export { default } from "./RepeaterDetails";
export { default as RepeaterDetails } from "./RepeaterDetails";

// Section components
export { RepeaterHeader } from "./RepeaterHeader";
export { FrequencySection } from "./FrequencySection";
export { LocationSection } from "./LocationSection";
export { TechnicalSpecsSection } from "./TechnicalSpecsSection";
export { DigitalModesSection } from "./DigitalModesSection";
export { NotesSection } from "./NotesSection";
export { WebsiteLink } from "./WebsiteLink";
export { OperationalStatusCard } from "./OperationalStatusCard";

// UI components
export { SectionCard } from "./SectionCard";
export { InfoCard } from "./InfoCard";
export { ShareButton } from "./ShareButton";

// Community subsystem
export { CommunitySection } from "./community/CommunitySection";
export { StatusDisplay } from "./community/StatusDisplay";
export { VoteDistributionBar } from "./community/VoteDistributionBar";
export { VotingButtons } from "./community/VotingButtons";
export { FeedbackDialog } from "./community/FeedbackDialog";
export { FeedbackList } from "./community/FeedbackList";
export { FeedbackEntryItem } from "./community/FeedbackEntryItem";
