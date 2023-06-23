import "./PlaygroundMenu.css"; // eslint-disable-line @typescript-eslint/no-import-type-side-effects
import * as React from "react";
import { ThemeSwitcher, ToolbarButton } from "../UI/Toolbar";
import { ToolbarPlayground } from "./ToolbarPlayground";
import { ValueCellInputPlayground } from "./ValueCellInputPlayground";
import { assertNever } from "assert-never";

type Playground = "None" | "ValueCellInputPlayground" | "ToolbarPlayground";

const allPlaygrounds: Playground[] = [
  "None",
  "ValueCellInputPlayground",
  "ToolbarPlayground",
];

export function PlaygroundMenu(): JSX.Element {
  const [playground, setPlayground] = React.useState<Playground>("None");

  return (
    <>
      <div className="PlaygroundMenu-menu">
        <ThemeSwitcher />
        {allPlaygrounds.map((playground, index) => (
          <ToolbarButton
            key={index}
            onClick={(): void => {
              setPlayground(playground);
            }}
          >
            {playground}
          </ToolbarButton>
        ))}
      </div>
      <div className="PlaygroundMenu-activity-root">
        <PlaygroundActivity playground={playground} />
      </div>
    </>
  );
}

interface PlaygroundActivityProps {
  playground: Playground;
}

function PlaygroundActivity(props: PlaygroundActivityProps): JSX.Element {
  const { playground } = props;

  switch (playground) {
    case "None":
      return <div>Click a button above</div>;
    case "ValueCellInputPlayground":
      return <ValueCellInputPlayground />;
    case "ToolbarPlayground":
      return <ToolbarPlayground />;
    default:
      return assertNever(playground);
  }
}