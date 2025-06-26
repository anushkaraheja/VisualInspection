import React, { useMemo, useState } from 'react';
import { Alert, ComplianceStatusInfo } from 'hooks/useAlerts';
import { useRouter } from 'next/router';
import Modal from '../shared/Modal';
import ButtonFromTheme from '../shared/ButtonFromTheme';
import AlertListTile from './AlertListTile';

interface AlertsListProps {
  alerts: Alert[];
  onResolveAlert: (alertId: string) => Promise<void>;
  onMoveToNextStatus?: (alertId: string, nextStatusId: string, comment: string, severity?: string) => Promise<boolean>;
  statuses: ComplianceStatusInfo[];
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export const AlertsList: React.FC<AlertsListProps> = ({ 
  alerts, 
  onResolveAlert,
  onMoveToNextStatus,
  statuses
}) => {
  const router = useRouter();
  const teamSlug = router.query.slug as string;
  
  // State for severity selection modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedNextStatusId, setSelectedNextStatusId] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('NOT_SET');
  const [comment, setComment] = useState<string>('');
  const [commentError, setCommentError] = useState<string>('');
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedAlertForComments, setSelectedAlertForComments] = useState<Alert | null>(null);
  
  // Sort statuses by their order field
  const sortedStatuses = useMemo(() => {
    return [...statuses].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [statuses]);
  
  // Find the default status
  const defaultStatus = useMemo(() => {
    return statuses.find(status => status.isDefault === true);
  }, [statuses]);
  
  /**
   * Get the next status in the workflow sequence
   * @param currentStatusId The current status ID
   * @returns The next status in the sequence or undefined if not found
   */
  const getNextStatus = (currentStatusId: string): ComplianceStatusInfo | undefined => {
    const currentStatusIndex = sortedStatuses.findIndex(status => status.id === currentStatusId);
    if (currentStatusIndex === -1 || currentStatusIndex === sortedStatuses.length - 1) {
      return undefined;
    }
    return sortedStatuses[currentStatusIndex + 1];
  };

  /**
   * Check if a status is the first status in the workflow
   */
  const isFirstStatus = (statusId: string | undefined): boolean => {
    if (!statusId || sortedStatuses.length === 0) return false;
    return statusId === sortedStatuses[0].id;
  };

  /**
   * Check if a status is the last status in the workflow
   */
  const isLastStatus = (statusId: string | undefined): boolean => {
    if (!statusId || sortedStatuses.length === 0) return false;
    return statusId === sortedStatuses[sortedStatuses.length - 1].id;
  };

  /**
   * Open severity selection modal when moving from first status
   */
  const handleMoveWithSeverity = (alertId: string, nextStatusId: string) => {
    setSelectedAlertId(alertId);
    setSelectedNextStatusId(nextStatusId);
    setIsModalOpen(true);
    setComment('');
    setCommentError('');
  };

  /**
   * Open comment modal for non-first status transitions
   */
  const handleMoveWithComment = (alertId: string, nextStatusId: string) => {
    setSelectedAlertId(alertId);
    setSelectedNextStatusId(nextStatusId);
    setIsCommentModalOpen(true);
    setComment('');
    setCommentError('');
  };

  /**
   * Handle movement to next status, with severity and comment
   */
  const handleMoveToNext = async () => {
    if (!selectedAlertId || !selectedNextStatusId) return;
    
    // Validate comment
    if (!comment.trim()) {
      setCommentError('Comment is required when changing status.');
      return;
    }
    
    if (onMoveToNextStatus) {
      const success = await onMoveToNextStatus(selectedAlertId, selectedNextStatusId, comment, selectedSeverity);
      if (success) {
        setIsModalOpen(false);
        setSelectedAlertId(null);
        setSelectedNextStatusId(null);
        setSelectedSeverity('NOT_SET');
        setComment('');
        setCommentError('');
      }
    }
  };

  /**
   * Handle comment-only move to next status
   */
  const handleCommentMove = async () => {
    if (!selectedAlertId || !selectedNextStatusId) return;
    
    // Validate comment
    if (!comment.trim()) {
      setCommentError('Comment is required when changing status.');
      return;
    }
    
    if (onMoveToNextStatus) {
      const success = await onMoveToNextStatus(selectedAlertId, selectedNextStatusId, comment);
      if (success) {
        setIsCommentModalOpen(false);
        setSelectedAlertId(null);
        setSelectedNextStatusId(null);
        setComment('');
        setCommentError('');
      }
    }
  };

  /**
   * Handle request for status change from tile component
   */
  const handleRequestStatusChange = (alertId: string, nextStatusId: string) => {
    // Determine if we need severity selection (first status) or just comment
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;
    
    const isFirstStatusInFlow = isFirstStatus(alert.status?.id);
    
    if (isFirstStatusInFlow) {
      handleMoveWithSeverity(alertId, nextStatusId);
    } else {
      handleMoveWithComment(alertId, nextStatusId);
    }
  };
  
  /**
   * Handle showing comment history
   */
  const handleViewComments = (alert: Alert) => {
    setSelectedAlertForComments(alert);
    setIsCommentsModalOpen(true);
  };

  return (
    <>
      <ul className="space-y-4">
        {alerts.map((alert) => {
          // Get the next status (available for all states except the last one)
          const nextStatus = getNextStatus(alert.status?.id || '');
          
          // Determine if this is the default (first) status
          const isFirstStatusInFlow = isFirstStatus(alert.status?.id);
          
          // Determine if this is the last status
          const isLastStatusInFlow = isLastStatus(alert.status?.id);
          
          return (
            <AlertListTile 
              key={alert.id}
              alert={alert}
              teamSlug={teamSlug}
              nextStatus={nextStatus}
              isFirstStatusInFlow={isFirstStatusInFlow}
              isLastStatusInFlow={isLastStatusInFlow}
              onViewComments={handleViewComments}
              onRequestStatusChange={handleRequestStatusChange}
              onResolveAlert={onResolveAlert}
            />
          );
        })}
      </ul>

      {/* Severity & Comment Selection Modal */}
      <Modal open={isModalOpen} close={() => setIsModalOpen(false)}>
        <Modal.Header>Update Alert Status</Modal.Header>
        <Modal.Description>Please provide severity level and a comment before moving to the next status.</Modal.Description>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Severity Level
              </label>
              <select
                id="severity"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              >
                <option value="NOT_SET">Not Set</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                id="comment"
                rows={3}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (e.target.value.trim()) setCommentError('');
                }}
                placeholder="Add your comment about this status change..."
                className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm
                  ${commentError ? 'border-red-500' : 'border-gray-300'}`}
              />
              {commentError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{commentError}</p>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <ButtonFromTheme
            onClick={() => setIsModalOpen(false)}
            outline={true}
          >
            Cancel
          </ButtonFromTheme>
          <ButtonFromTheme
            onClick={handleMoveToNext}
          >
            Confirm & Move
          </ButtonFromTheme>
        </Modal.Footer>
      </Modal>
      
      {/* Comment-Only Modal */}
      <Modal open={isCommentModalOpen} close={() => setIsCommentModalOpen(false)}>
        <Modal.Header>Update Alert Status</Modal.Header>
        <Modal.Description>Please provide a comment about this status change.</Modal.Description>
        <Modal.Body>
          <div>
            <label htmlFor="comment-only" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              id="comment-only"
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (e.target.value.trim()) setCommentError('');
              }}
              placeholder="Add your comment about this status change..."
              className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm
                ${commentError ? 'border-red-500' : 'border-gray-300'}`}
            />
            {commentError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">{commentError}</p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <ButtonFromTheme
            onClick={() => setIsCommentModalOpen(false)}
            outline={true}
          >
            Cancel
          </ButtonFromTheme>
          <ButtonFromTheme
            onClick={handleCommentMove}
          >
            Confirm & Move
          </ButtonFromTheme>
        </Modal.Footer>
      </Modal>

      {/* Comments History Modal */}
      <Modal open={isCommentsModalOpen} close={() => setIsCommentsModalOpen(false)}>
        <Modal.Header>Comment History</Modal.Header>
        <Modal.Description>
          Comments for Worker {selectedAlertForComments?.workerId}
        </Modal.Description>
        <Modal.Body className="max-h-96 overflow-y-auto">
          {selectedAlertForComments?.comments && selectedAlertForComments.comments.length > 0 ? (
            <ul className="space-y-4">
              {selectedAlertForComments.comments.map((comment, index) => {
                // Find the status names for from/to
                const fromStatus = statuses.find(s => s.id === comment.statusFrom)?.name || 'Initial';
                const toStatus = statuses.find(s => s.id === comment.statusTo)?.name || 'Unknown';
                
                return (
                  <li key={index} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="flex justify-between items-baseline text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {comment.user}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                      Status change: {fromStatus} → {toStatus}
                    </div>
                    <p className="mt-2 text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">
                      {comment.text}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No comment history available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <ButtonFromTheme
            onClick={() => setIsCommentsModalOpen(false)}
          >
            Close
          </ButtonFromTheme>
        </Modal.Footer>
      </Modal>
    </>
  );
};
