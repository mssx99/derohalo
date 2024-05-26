import React, { useState } from 'react';
import { useContract, usePendingListings } from 'hooks/webHooks';
import {
    DataGrid,
    useGridApiRef,
    GridToolbarContainer,
    GridActionsCellItem,
    GridActionsCellItemProps,
    GridRowId,
    GridRowsProp,
    GridColDef,
    GridValueGetterParams,
    GridRenderEditCellParams,
} from '@mui/x-data-grid';
import Fieldset from 'components/common/Fieldset';
import PendingApprovalsTable from './PendingApprovalsTable';

const PendingApprovals: React.FC = () => {
    const contract = useContract();
    const listings = usePendingListings();

    if (!contract || (!contract.guaranteeApprovalRequiredBeforePublishing && !listings.length)) return <></>;

    return (
        <Fieldset title="Pending Market Listing Approvals of GuaranteeContracts">
            {listings.length > 0 ? <PendingApprovalsTable listings={listings} /> : <div>No listings are pending for approval.</div>}
        </Fieldset>
    );
};

export default PendingApprovals;
