import React from 'react';
import { ButtonColorful } from './ButtonColorful';

const RoleSelection = ({ onSelectHost, onSelectParticipant }) => {
  return (
    <div id="roleScreen">
      <div className="content-card">
        <div className="screen-header">
          <h1 className="screen-title">Select Your Role</h1>
          <p className="screen-subtitle">Choose how you want to participate</p>
        </div>

        <div className="content-inner">
          <div className="button-group" style={{ display: 'flex', gap: '24px', flexDirection: 'row', maxWidth: '800px', margin: '0 auto' }}>
            <ButtonColorful 
              onClick={onSelectHost}
              label="Host"
              subtitle="Manage Quiz"
            />
            <ButtonColorful 
              onClick={onSelectParticipant}
              label="Participant"
              subtitle="Take Quiz"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
