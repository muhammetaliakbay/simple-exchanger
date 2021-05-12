import React from "react";
import {Box, CircularProgress, CircularProgressProps, Typography} from "@material-ui/core";

// BASED ON: https://material-ui.com/components/progress/#CircularWithValueLabel.tsx

export function CircularProgressWithLabel(props: CircularProgressProps & { label: any }) {
    return (
        <Box position="relative" display="inline-flex">
            <CircularProgress {...props} />
            <Box
                top={0}
                left={0}
                bottom={0}
                right={0}
                position="absolute"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Typography variant="caption" component="div" color="textSecondary">{props.label}</Typography>
            </Box>
        </Box>
    );
}