import ConditionsDialog from 'components/MultiSigDesigner/dialogs/ConditionsDialog';
import WalletDialog from 'components/MultiSigDesigner/dialogs/WalletDialog';
import React from 'react';
import PreferencesDialog from 'components/Main/PreferencesDialog';
import DirectoryDialog from './DirectoryDialog';

import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import TransactionDialog from 'components/MultiSigDesigner/Transactions/dialogs/TransactionDialog';
import DepositDialog from 'components/common/dialogs/DepositDialog';
import HistoryDialog from 'components/MultiSigDesigner/dialogs/HistoryDialog';
import GuaranteePartyDialog from 'components/GuaranteeDesigner/dialogs/GuaranteePartyDialog';
import StageDialog from 'components/GuaranteeDesigner/dialogs/StageDialog';
import SmartContractVerificationDialog from 'components/common/dialogs/SmartContractVerificationDialog';
import CompareSmartContractDialog from 'components/common/dialogs/CompareSmartContractDialog';
import ImagePastedDialog from 'components/Chat/dialogs/ImagePastedDialog';
import AudioConfiguratorDialog from 'components/Chat/dialogs/AudioConfiguratorDialog';
import RegisterChatMinimumDialog from 'components/Web/dialogs/RegisterChatMinimumDialog';
import RegisterGuaranteeDialog from 'components/Web/dialogs/RegisterGuaranteeDialog';
import AddImageDialog from 'components/GuaranteeDesigner/dialogs/AddImageDialog';
import ImageDisplayDialog from 'components/common/dialogs/ImageDisplayDialog';
import HaloButtonDialog from 'components/Chat/HaloButtonWebsite/HaloButtonDialog';
import WelcomeDialog from './WelcomeDialog';

const Dialogs: React.FC = () => {
    return (
        <>
            <WelcomeDialog />
            <PreferencesDialog />
            <DirectoryDialog />
            <ConditionsDialog />
            <WalletDialog />
            <HistoryDialog />
            <TransactionDialog />
            <DepositDialog />
            <SmartContractVerificationDialog />
            <GuaranteePartyDialog />
            <StageDialog />
            <AddImageDialog />
            <CompareSmartContractDialog />
            <ImagePastedDialog />
            <AudioConfiguratorDialog />
            <RegisterChatMinimumDialog />
            <RegisterGuaranteeDialog />
            <ImageDisplayDialog />
            <HaloButtonDialog />
        </>
    );
};

interface IDialogCloseButton {
    onClose: () => void;
}

export const DialogCloseButton: React.FC<IDialogCloseButton> = ({ onClose }) => {
    return (
        <IconButton
            sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
            }}
            onClick={onClose}
        >
            <CloseIcon />
        </IconButton>
    );
};

export default Dialogs;
