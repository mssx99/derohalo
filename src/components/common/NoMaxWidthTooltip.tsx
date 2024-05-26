import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

const NoMaxWidthTooltip = styled(({ className, ...props }: TooltipProps) => <Tooltip {...props} classes={{ popper: className }} />)`
    & .MuiTooltip-tooltip {
        max-width: none;
        font-size: 0.875rem;
        border: 1px solid #dadde9;
        white-space: nowrap;
    }
`;

export default NoMaxWidthTooltip;
