import * as React from "react";
import {
  type DynamicCSS,
  type RegisteredDynCSS,
  css,
  withDynamicCSS,
} from "./DynamicCSS";

export interface Animation {
  /**
   * The start position of the animation.
   */
  start: DOMRect;

  /**
   * The end position of the animation.
   */
  end: DOMRect;

  /**
   * How long the animation should last (milliseconds).
   */
  duration: number;
}

/**
 * The `Animate` function is to create an animation where an element moves
 * accross the screen.
 *
 * A new element will be created, and will move using a linear animation
 * function from a start position to an end position, and then will be
 * deleted.
 *
 * @param onEndCallback Will be called after the animation is complete.
 */
export type Animate = (animation: Animation, onEndCallback: () => void) => void;

type ActiveAnimationId = number;

interface ActiveAnimation {
  timeoutHandle: ReturnType<typeof setTimeout>;
  elem: AnimatedElem;
}

interface AnimatedElem {
  domElem: HTMLElement;
  dynCss: RegisteredDynCSS;
}

/**
 * Creates the new animated element: a `<div>` with a CSS animation applied to
 * it that moves it from the start position to the end position.
 */
function createAnimatedElem(animation: Animation): AnimatedElem {
  const elem = document.createElement("div");

  const dynCss = withDynamicCSS((dyn: DynamicCSS) => {
    // TODO Allow setting the contents of the animated node.
    document.createTextNode("TEST");

    const move = dyn.keyframes(css`
      from {
        left: ${animation.start.left}px;
        top: ${animation.start.top}px;
        width: ${animation.start.width}px;
        height: ${animation.start.height}px;
      }

      to {
        left: ${animation.end.left}px;
        top: ${animation.end.top}px;
        width: ${animation.end.width}px;
        height: ${animation.end.height}px;
      }
    `);

    const style = dyn.class(css`
      position: absolute;
      background-color: blue;
      color: green;
      animation: ${move} ${animation.duration}ms linear;
    `);

    elem.className = style;
  });

  document.body.appendChild(elem);

  return {
    domElem: elem,
    dynCss: dynCss,
  };
}

function deleteActiveAnimation(activeAnimation: ActiveAnimation): void {
  clearTimeout(activeAnimation.timeoutHandle);
  deleteAnimatedElem(activeAnimation.elem);
}

function deleteAnimatedElem(animatedElem: AnimatedElem): void {
  document.body.removeChild(animatedElem.domElem);
  animatedElem.dynCss.dispose();
}

/**
 * Provides a React component with an `animate` function that can be used to
 * create animations that move an element accross the screen.
 *
 * This is in the form of a React hook so that the animations will
 * automatically be stopped and deleted when the component unmounts.
 */
export function useAnimate(): Animate {
  const nextActiveAnimationid = React.useRef<ActiveAnimationId>(1);
  const activeAnimations = React.useRef(
    new Map<ActiveAnimationId, ActiveAnimation>()
  );

  React.useEffect(() => {
    // Make an alias to the ref so we can use it in the cleanup function
    // without getting an invalid react-hooks lint warning.
    const activeAnimationsRef = activeAnimations;

    return () => {
      activeAnimationsRef.current.forEach(deleteActiveAnimation);
    };
  }, []);

  return (animation: Animation, onEndCallback: () => void): void => {
    const activeAnimationid = nextActiveAnimationid.current;
    nextActiveAnimationid.current += 1;

    const animatedElem = createAnimatedElem(animation);

    const handle = setTimeout(() => {
      activeAnimations.current.delete(activeAnimationid);
      deleteAnimatedElem(animatedElem);
      onEndCallback();
    }, animation.duration);

    activeAnimations.current.set(activeAnimationid, {
      timeoutHandle: handle,
      elem: animatedElem,
    });
  };
}