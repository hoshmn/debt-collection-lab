import React from "react";
import { Typography as MuiTypography, withStyles } from "@material-ui/core";
import clsx from "clsx";
import { forwardRef } from "react";

const style = (theme) => ({
  grey: {
    color: "#555",
  },
  bold: {
    fontWeight: 700,
  },
  medium: {
    fontWeight: 500,
  },
  light: {
    fontWeight: 400,
  },
  gutterTop: {
    marginTop: theme.spacing(1),
  },
});

/**
 * Overrides default material UI typography with some additional variants
 */
const Typography = forwardRef(
  (
    { weight, variant, color, gutterTop, classes, className, ...props },
    ref
  ) => {
    const isCustomVariant = Object.keys(classes).indexOf(variant) > -1;
    const isCustomColor = Object.keys(classes).indexOf(color) > -1;
    return (
      <MuiTypography
        ref={ref}
        className={clsx(
          {
            [classes[variant]]: isCustomVariant,
            [classes[color]]: isCustomColor,
            [classes.bold]: weight === "bold",
            [classes.medium]: weight === "medium",
            [classes.light]: weight === "light",
            [classes.gutterTop]: gutterTop,
          },
          className
        )}
        variant={isCustomVariant ? undefined : variant}
        color={isCustomColor ? undefined : color}
        {...props}
      />
    );
  }
);

export default withStyles(style)(Typography);