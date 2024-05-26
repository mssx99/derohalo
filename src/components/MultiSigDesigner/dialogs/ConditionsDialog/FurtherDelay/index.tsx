import React from 'react';
import { useConditionDialog } from '..';
import { useContract } from 'hooks/multiSigHooks';
import AddTime from './AddTime';
import DefineUsers from './DefineUsers';

const FurtherDelay: React.FC = () => {
    const { isLoaded } = useContract();

    return isLoaded ? <AddTime /> : <DefineUsers />;
};

export default FurtherDelay;
