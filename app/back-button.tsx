import {IconButton} from "@material-ui/core";
import {ArrowBack} from "@material-ui/icons";
import React from "react";
import {useHistory, useRouteMatch} from "react-router-dom";

export function BackButton() {
    const homeMatch = useRouteMatch({
        path: ["/", "/:exchangerAddress"],
        exact: true
    });
    const history = useHistory()

    return <>{
        <IconButton disabled={!!homeMatch} onClick={() => history.goBack()}
                    edge="start"
                    color="inherit">
            <ArrowBack />
        </IconButton>
    }</>
}
