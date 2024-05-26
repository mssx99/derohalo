import LocalStorage from 'browserStorage/localStorage';
import SwitchWithLabel from 'components/common/SwitchWithLabel';
import { usePreferences } from 'hooks/mainHooks';
import React from 'react';

const VerificationDialog: React.FC = () => {
    const { showContractVerificationAlways, setShowContractVerificationAlways } = usePreferences();

    const handleChange = (checked: boolean) => {
        setShowContractVerificationAlways(checked);
        LocalStorage.setShowVerificationDialogAlways(checked);
    };

    return <SwitchWithLabel label="Show Verification Dialog always when loading a contract" checked={showContractVerificationAlways} onChange={handleChange} />;
};

export default VerificationDialog;
