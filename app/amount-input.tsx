import {InputAdornment, TextField} from "@material-ui/core";
import {BigNumber} from "ethers";
import React, {useEffect, useState} from "react";
import {fromFixedPointString, InvalidFixedPointExpression, PrecisionOverflow} from "./amount-utils";
import {Currency} from "../client/currency";
import {TextFieldProps} from "@material-ui/core";

export function AmountInput(
    {
        currency,
        onChange,
        errorMessage,
        textFieldProps
    }: {
        currency: Currency,
        onChange: (amount: BigNumber | undefined) => void,
        errorMessage?: any,
        textFieldProps?: TextFieldProps
    }
) {
    const [text, setText] = useState("")
    const [internalErrorMessage, setInternalErrorMessage] = useState<string>()

    useEffect(
        () => {
            if (text.length == 0) {
                setInternalErrorMessage(undefined);
                onChange(undefined)
            } else {
                let integer: BigNumber | undefined;
                try {
                    integer = fromFixedPointString(text, currency.precision)
                    setInternalErrorMessage(undefined)
                } catch (err) {
                    integer = undefined;
                    if (err instanceof InvalidFixedPointExpression) {
                        setInternalErrorMessage("invalid amount")
                    } else if (err instanceof PrecisionOverflow) {
                        setInternalErrorMessage("too much precision")
                    } else {
                        setInternalErrorMessage("unexpected error")
                    }
                } finally {
                    onChange(integer);
                }
            }
        }, [text]
    )

    return <TextField InputProps={{
                            startAdornment: <InputAdornment position="start">{currency.code}</InputAdornment>,
                      }}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      error={!!(errorMessage ?? internalErrorMessage)}
                      helperText={errorMessage ?? internalErrorMessage}
                      {...textFieldProps} />
}