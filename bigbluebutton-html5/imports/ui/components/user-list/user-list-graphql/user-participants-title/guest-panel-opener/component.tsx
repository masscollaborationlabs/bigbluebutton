import React, { useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Meteor } from 'meteor/meteor';
import { Meeting } from '/imports/ui/Types/meeting';
import { useMeeting } from '/imports/ui/core/hooks/useMeeting';
import { useSubscription } from '@apollo/client';
import { GET_GUESTS_COUNT, GuestUsersCountResponse } from './queries';
import { layoutDispatch, layoutSelectInput } from '/imports/ui/components/layout/context';
import { Input } from '/imports/ui/components/layout/layoutTypes';
import { ACTIONS, PANELS } from '/imports/ui/components/layout/enums';
import Icon from '/imports/ui/components/common/icon/icon-ts/component';
import Styled from './styles';
import logger from '/imports/startup/client/logger';

const ALWAYS_SHOW_WAITING_ROOM = Meteor.settings.public.app.alwaysShowWaitingRoomUI;

interface GuestPanelOpenerProps {
  count: number;
}

const intlMessages = defineMessages({
  waitingUsersTitle: {
    id: 'app.userList.guest.waitingUsersTitle',
    description: 'Title for the notes list',
  },
  title: {
    id: 'app.userList.guest.waitingUsers',
    description: 'Title for the waiting users',
  },
});

const GuestPanelOpener: React.FC<GuestPanelOpenerProps> = ({
  count: pendingUsers = 0,
}) => {
  const layoutContextDispatch = layoutDispatch();
  const sidebarContent = layoutSelectInput((i: Input) => i.sidebarContent);
  const { sidebarContentPanel } = sidebarContent;
  const intl = useIntl();
  const toggleWaitingPanel = useCallback(() => {
    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
      value: sidebarContentPanel !== PANELS.WAITING_USERS,
    });
    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
      value: sidebarContentPanel === PANELS.WAITING_USERS
        ? PANELS.NONE
        : PANELS.WAITING_USERS,
    });
  }, [sidebarContentPanel]);

  return (
    <Styled.Messages>
      <Styled.Container>
        <Styled.SmallTitle>
          {intl.formatMessage(intlMessages.waitingUsersTitle)}
        </Styled.SmallTitle>
      </Styled.Container>
      <Styled.ScrollableList>
        <Styled.List>
          <Styled.ListItem
            role="button"
            data-test="waitingUsersBtn"
            tabIndex={0}
            onClick={toggleWaitingPanel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                toggleWaitingPanel();
              }
            }}
          >
            <Icon iconName="user" />
            <span>{intl.formatMessage(intlMessages.title)}</span>
            {pendingUsers > 0 && (
              <Styled.UnreadMessages>
                <Styled.UnreadMessagesText>
                  {pendingUsers}
                </Styled.UnreadMessagesText>
              </Styled.UnreadMessages>
            )}
          </Styled.ListItem>
        </Styled.List>
      </Styled.ScrollableList>
    </Styled.Messages>
  );
};

const GuestPanelOpenerContainer: React.FC = () => {
  const currentMeeting: Partial<Meeting> = useMeeting((meeting) => {
    const a = {
      usersPolicies: meeting.usersPolicies,
    };

    return a;
  });

  const {
    data: guestsCountData,
    loading: guestsCountLoading,
    error: guestsCountError,
  } = useSubscription<GuestUsersCountResponse>(GET_GUESTS_COUNT);

  if (guestsCountError) {
    logger.error(guestsCountError);
    return (
      <div>
        {
          JSON.stringify(guestsCountError)
        }
      </div>
    );
  }

  if (guestsCountLoading || !currentMeeting) return null;

  const showWaitingRoom = (ALWAYS_SHOW_WAITING_ROOM
        && currentMeeting?.usersPolicies?.guestPolicy === 'ASK_MODERATOR')
        || (guestsCountData?.user_guest_aggregate.aggregate.count || 0) > 0;

  if (!showWaitingRoom) return null;

  return (
    <GuestPanelOpener
      count={guestsCountData?.user_guest_aggregate.aggregate.count || 0}
    />
  );
};

export default GuestPanelOpenerContainer;
