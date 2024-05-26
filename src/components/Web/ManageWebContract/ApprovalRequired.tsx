import React from 'react';
import SwitchWithLabel from 'components/common/SwitchWithLabel';

interface IApprovalRequired {
    value: boolean;
    onChange: (value: boolean) => void;
    readOnly?: boolean;
}

const ApprovalRequired: React.FC<IApprovalRequired> = ({ value, onChange, readOnly = false }) => {
    return <SwitchWithLabel label="Approval Required for Listings" checked={value} onChange={onChange} disabled={readOnly} />;
};

export default ApprovalRequired;
