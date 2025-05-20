import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { PopupEvent, PopupEventType, usePopupEventStore } from '@/stores/popupEventStore';
import { getPopupEventService } from '@/services/popupEventService';
import TransactionSignView from './components/TransactionSignView';
import WalletConnectView from './components/WalletConnectView';

const EventPopup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [event, setEvent] = useState<PopupEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset state when location changes
  useEffect(() => {
    // Reset loading state and error when URL changes
    setLoading(true);
    setError(null);
    setEvent(null);

    // Improved parameter parsing logic
    // First try to get eventId directly from the search params (handled by React Router)
    let eventId = searchParams.get('eventId');

    // If not found, try to parse from location.search
    if (!eventId && location.search) {
      const directParams = new URLSearchParams(location.search.substring(1));
      eventId = directParams.get('eventId');
    }

    // If still not found, try to parse from hash fragment (for HashRouter)
    if (!eventId && location.hash) {
      // Parse parameters from the hash part of the URL
      // Format: #/event?eventId=123&type=xyz
      const hashParts = location.hash.split('?');
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        eventId = hashParams.get('eventId');
      }
    }

    if (!eventId) {
      setError('No event ID provided');
      setLoading(false);
      return;
    }

    // Find the active event
    const events = usePopupEventStore.getState().events;

    const activeEvent = events.find(e => e.id === eventId);

    if (!activeEvent) {
      setError('Event not found');
      setLoading(false);
      return;
    }

    setEvent(activeEvent);
    setLoading(false);
  }, [searchParams, location]);

  const handleApprove = async (result: any) => {
    if (!event) return;
    await getPopupEventService().approveEvent(event.id, result);
  };

  const handleReject = async (reason?: string) => {
    if (!event) return;
    await getPopupEventService().rejectEvent(event.id, reason);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <div className="text-red-500 text-lg font-medium mb-4">Error</div>
        <div className="text-center">{error}</div>
        <button
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
          onClick={() => window.close()}
        >
          Close
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">No event to process</div>
      </div>
    );
  }

  // Render appropriate component based on event type with a unique key
  // to ensure component is remounted when event changes
  switch (event.type) {
    case PopupEventType.TRANSACTION_SIGN:
      return (
        <TransactionSignView
          key={event.id}
          event={event}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      );

    case PopupEventType.WALLET_CONNECT:
      return (
        <WalletConnectView
          key={event.id}
          event={event}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      );

    default:
      return (
        <div className="flex h-full flex-col items-center justify-center p-4">
          <div className="text-yellow-500 text-lg font-medium mb-4">Unsupported Event</div>
          <div className="text-center">The event type "{event.type}" is not supported</div>
          <button
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            onClick={() => handleReject('Unsupported event type')}
          >
            Reject
          </button>
        </div>
      );
  }
};

export default EventPopup;
