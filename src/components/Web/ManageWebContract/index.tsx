import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useContract, useIsWebOwner } from 'hooks/webHooks';
import PackageSize from './PackageSize';
import PackagePrice from './PackagePrice';
import ApprovalRequired from './ApprovalRequired';
import Form, { FormElement } from 'components/common/Form';
import Fieldset from 'components/common/Fieldset';
import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';
import TextField from 'components/common/TextField';
import Button from '@mui/material/Button';
import { saveConfiguration } from 'helpers/Web/WebContractHelper';
import { addSnackbar } from 'components/screen/Snackbars';
import { MAX_CHAT_PERCENTAGE, MAX_GUARANTEE_PERCENTAGE, MESSAGE_SEVERITY } from 'Constants';
import LoadingButton from 'components/common/LoadingButton';
import { updateWalletBalance, useIsConnected } from 'hooks/deroHooks';
import PublishFee from './PublishFee';
import { usePrevious } from 'hooks/customHooks';

const Column = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const Row = styled('div')`
    display: flex;
    flex-direction: row;
    gap: 10px;
`;

const SaveButton = styled(LoadingButton)`
    align-self: flex-start;
    margin-bottom: 0 !important;
`;

const ManageWebContract: React.FC = () => {
    const contract = useContract();
    const isWebOwner = useIsWebOwner();
    const [hasChanged, setHasChanged] = useState(false);
    const hasChangedRef = useRef(false);
    const isConnected = useIsConnected();

    const [loadingSaveConfiguration, setLoadingSaveConfiguration] = useState(false);

    const [name, setName] = useState(contract?.name ?? '');
    const [description, setDescription] = useState(contract?.description ?? '');
    const [chatPublishFee, setChatPublishFee] = useState(contract?.chatPublishFee ? contract?.chatPublishFee : 0);
    const [chatPublishFeeMinimum, setChatPublishFeeMinimum] = useState(contract?.chatPublishFeeMinimum ?? 0);
    const [guaranteePublishFee, setGuaranteePublishFee] = useState(contract?.guaranteePublishFee ?? MAX_GUARANTEE_PERCENTAGE + 1);
    const [guaranteePublishFeeMinimum, setGuaranteePublishFeeMinimum] = useState(contract?.guaranteePublishFeeMinimum ?? 0);
    const [guaranteeBlockPackageSize, setGuaranteeBlockPackageSize] = useState(contract?.guaranteeBlockPackageSize ?? 1000);
    const [guaranteeBlockPackagePrice, setGuaranteeBlockPackagePrice] = useState(contract?.guaranteeBlockPackagePrice ?? 100000);
    const [guaranteeApprovalRequiredBeforePublishing, setGuaranteeApprovalRequiredBeforePublishing] = useState(contract?.guaranteeApprovalRequiredBeforePublishing ?? true);

    const prevContract = usePrevious(contract) ?? null;
    const prevContractRef = useRef<IWebContract | null>(null);

    useEffect(() => {
        hasChangedRef.current = hasChanged;
        prevContractRef.current = prevContract;
    }, [hasChanged, prevContract]);

    useEffect(() => {
        if (!contract || (contract.scid === prevContractRef.current?.scid && hasChangedRef.current)) return;
        setName(contract.name);
        setDescription(contract.description);
        setChatPublishFee(contract.chatPublishFee);
        setChatPublishFeeMinimum(contract.chatPublishFeeMinimum);
        setGuaranteePublishFee(contract.guaranteePublishFee);
        setGuaranteePublishFeeMinimum(contract.guaranteePublishFeeMinimum);
        setGuaranteeBlockPackageSize(contract.guaranteeBlockPackageSize);
        setGuaranteeBlockPackagePrice(contract.guaranteeBlockPackagePrice);
        setGuaranteeApprovalRequiredBeforePublishing(contract.guaranteeApprovalRequiredBeforePublishing);
    }, [contract]);

    useEffect(() => {
        if (!contract) {
            setHasChanged(false);
            return;
        }
        setHasChanged(
            name !== contract.name ||
                description !== contract.description ||
                chatPublishFee !== contract.chatPublishFee ||
                chatPublishFeeMinimum !== contract.chatPublishFeeMinimum ||
                guaranteePublishFee !== contract.guaranteePublishFee ||
                guaranteePublishFeeMinimum !== contract.guaranteePublishFeeMinimum ||
                guaranteeBlockPackageSize !== contract.guaranteeBlockPackageSize ||
                guaranteeBlockPackagePrice !== contract.guaranteeBlockPackagePrice ||
                guaranteeApprovalRequiredBeforePublishing !== contract.guaranteeApprovalRequiredBeforePublishing
        );
    }, [
        contract,
        name,
        description,
        chatPublishFee,
        chatPublishFeeMinimum,
        guaranteePublishFee,
        guaranteePublishFeeMinimum,
        guaranteeBlockPackageSize,
        guaranteeBlockPackagePrice,
        guaranteeApprovalRequiredBeforePublishing,
    ]);

    const handleNameChange = ({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>) => {
        setName(value);
    };

    const handleDescriptionChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
        setDescription(value);
    };

    const handleChatPublishFeeChange = (fee: Uint64, minimum: Uint64 = 0) => {
        setChatPublishFee(fee);
        setChatPublishFeeMinimum(minimum);
    };

    const handleGuaranteePublishFeeChange = (fee: Uint64, minimum: Uint64 = 0) => {
        setGuaranteePublishFee(fee);
        setGuaranteePublishFeeMinimum(minimum);
    };

    const handlePackageSizeChange = (value: Uint64) => {
        setGuaranteeBlockPackageSize(value);
    };

    const handlePackagePriceChange = (value: Uint64) => {
        setGuaranteeBlockPackagePrice(value);
    };

    const handleApprovalRequiredChange = (value: boolean) => {
        setGuaranteeApprovalRequiredBeforePublishing(value);
    };

    const handleSaveConfigurationClick = useCallback(async () => {
        if (!contract?.scid) {
            addSnackbar({ message: 'No contract scid', severity: MESSAGE_SEVERITY.ERROR });
            return;
        }
        setLoadingSaveConfiguration(true);
        try {
            await saveConfiguration({
                scid: contract.scid,
                name,
                description,
                chatPublishFee,
                chatPublishFeeMinimum,
                guaranteePublishFee,
                guaranteePublishFeeMinimum,
                guaranteeApprovalRequiredBeforePublishing,
                guaranteeBlockPackageSize,
                guaranteeBlockPackagePrice,
            });
            addSnackbar({ message: 'Successfully updated.', severity: MESSAGE_SEVERITY.SUCCESS });
        } catch (e) {
            addSnackbar({ message: 'An Error happened.', severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setLoadingSaveConfiguration(false);
        }
    }, [
        contract,
        name,
        description,
        chatPublishFee,
        chatPublishFeeMinimum,
        guaranteePublishFee,
        guaranteePublishFeeMinimum,
        guaranteeBlockPackageSize,
        guaranteeBlockPackagePrice,
        guaranteeApprovalRequiredBeforePublishing,
    ]);

    if (!contract) return <></>;

    return (
        <Fieldset title="Manage Web Contract">
            <Column sx={{ width: '100%' }}>
                <TextField label="Name" value={name} onChange={handleNameChange} sx={{ flexGrow: 1 }} readOnly={!isWebOwner} />
                <TextField label="Description" value={description} onChange={handleDescriptionChange} multiline readOnly={!isWebOwner} />
                <Row>
                    <Column sx={{ flexGrow: 1 }}>
                        <Row>
                            <Chip label="Chat" />
                            <PublishFee
                                valueFee={chatPublishFee}
                                valueMinimum={chatPublishFeeMinimum}
                                onChange={handleChatPublishFeeChange}
                                maxPercentage={MAX_CHAT_PERCENTAGE}
                                readOnly={!isWebOwner}
                            />
                        </Row>
                        <SaveButton loading={loadingSaveConfiguration} onClick={handleSaveConfigurationClick} disabled={!hasChanged}>
                            Save Configuration
                        </SaveButton>
                    </Column>

                    <Chip label="Guarantee" />
                    <Column>
                        <PublishFee
                            valueFee={guaranteePublishFee}
                            valueMinimum={guaranteePublishFeeMinimum}
                            onChange={handleGuaranteePublishFeeChange}
                            maxPercentage={MAX_GUARANTEE_PERCENTAGE}
                            readOnly={!isWebOwner}
                        />
                        <Row>
                            <PackagePrice value={guaranteeBlockPackagePrice} onChange={handlePackagePriceChange} readOnly={!isWebOwner} />
                            <PackageSize value={guaranteeBlockPackageSize} onChange={handlePackageSizeChange} readOnly={!isWebOwner} />
                        </Row>
                        <ApprovalRequired value={guaranteeApprovalRequiredBeforePublishing} onChange={handleApprovalRequiredChange} readOnly={!isWebOwner} />
                    </Column>
                </Row>
            </Column>
        </Fieldset>
    );
};

export default ManageWebContract;
