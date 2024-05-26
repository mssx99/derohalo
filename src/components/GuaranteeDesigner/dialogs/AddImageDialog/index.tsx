import React, { useId, useState, useEffect } from 'react';
import Button from '@mui/material/Button';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { DialogCloseButton } from 'components/Main/Dialogs';
import { TransitionForDialog } from 'components/common/Transitions';
import { TransitionProps } from '@mui/material/transitions';
import { useContract } from 'hooks/guaranteeHooks';

import { create } from 'zustand';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';

import Step0 from './Step0';
import Step1 from './Step1';

type GuaranteeDialogStore = {
    isOpen: boolean;
    setOpen: (newOpen: boolean) => void;
    step: number;
    setStep: (step: number) => void;
    blob: Blob | null;
    setBlob: (blob: Blob | null) => void;
    base64: string | null;
    setBase64: (base64: string | null) => void;
    description: string;
    setDescription: (description: string) => void;
};

const useGuaranteeDialogStore = create<GuaranteeDialogStore>((set) => ({
    isOpen: false,
    setOpen: (isOpen: boolean) => set({ isOpen }),
    step: 0,
    setStep: (step: number) => set({ step }),
    blob: null,
    setBlob: (blob: Blob | null) => set({ blob }),
    base64: null,
    setBase64: (base64: string | null) => set({ base64 }),
    description: '',
    setDescription: (description: string) => set({ description }),
}));

export const useAddImageDialog: () => {
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
    step: number;
    setStep: (step: number) => void;
    blob: Blob | null;
    setBlob: (blob: Blob | null) => void;
    base64: string | null;
    setBase64: (base64: string | null) => void;
    description: string;
    setDescription: (description: string) => void;
} = () => {
    const isOpen = useGuaranteeDialogStore((state) => state.isOpen);
    const setOpen = useGuaranteeDialogStore((state) => state.setOpen);
    const step = useGuaranteeDialogStore((state) => state.step);
    const setStep = useGuaranteeDialogStore((state) => state.setStep);
    const blob = useGuaranteeDialogStore((state) => state.blob);
    const setBlob = useGuaranteeDialogStore((state) => state.setBlob);
    const base64 = useGuaranteeDialogStore((state) => state.base64);
    const setBase64 = useGuaranteeDialogStore((state) => state.setBase64);
    const description = useGuaranteeDialogStore((state) => state.description);
    const setDescription = useGuaranteeDialogStore((state) => state.setDescription);

    return { isOpen, setOpen, step, setStep, blob, setBlob, base64, setBase64, description, setDescription };
};

const steps = ['Provide Image', 'Configure and send'];

const AddImageDialog: React.FC = () => {
    const { isOpen, setOpen, step, setStep, setBlob, setDescription } = useAddImageDialog();
    const { contract } = useContract();
    const id_scrollDialogTitle = useId();
    const id_content = useId();
    const id_actions = useId();

    const handleClose = () => {
        setOpen(false);
    };

    const handleExit = () => {
        setStep(0);
        setDescription('');
        setBlob(null);
    };

    const [currentScreen, setCurrentScreen] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        switch (step) {
            case 1:
                setCurrentScreen(<Step1 contentId={id_content} actionsId={id_actions} />);
                break;
            default:
                setCurrentScreen(<Step0 contentId={id_content} actionsId={id_actions} />);
                break;
        }
    }, [step]);

    return (
        <Dialog
            sx={{
                '& .MuiDialog-container': {
                    '& .MuiPaper-root': {
                        width: '45rem',
                        maxWidth: '100%',
                    },
                },
            }}
            open={isOpen}
            onClose={handleClose}
            scroll="paper"
            TransitionComponent={TransitionForDialog}
            TransitionProps={{
                onExited: () => {
                    handleExit();
                },
            }}
            aria-labelledby={id_scrollDialogTitle}
        >
            <DialogTitle id={id_scrollDialogTitle}>Add Image to Guarantee-Contract</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <Stepper activeStep={step} style={{ marginBottom: '2rem' }}>
                    {steps.map((label, index) => {
                        const stepProps: { completed?: boolean } = {};
                        const labelProps: {
                            optional?: React.ReactNode;
                        } = {};
                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel {...labelProps}>{label}</StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
                <div id={id_content}></div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <div id={id_actions}></div>
                {currentScreen}
            </DialogActions>
        </Dialog>
    );
};

export default AddImageDialog;
