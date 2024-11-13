import { Toolbar } from "../UI/Toolbar";
import type { UIStrings } from "../UI/UIStrings";

const samplePrograms: string[] = ["SampleProgram1", "SampleProgram2"];

export interface ToolbarPlaygroundProps {
  uiString: UIStrings;
}

export function ToolbarPlayground(
  props: ToolbarPlaygroundProps,
): React.JSX.Element {
  const { uiString } = props;

  return (
    <>
      <div>Standard Toolbar (PendingFetch):</div>
      <div>
        <Toolbar
          uiString={uiString}
          showThemeSwitcher={true}
          showSamplePrograms={true}
          showSourceLoader={true}
          cpuState={{ kind: "PendingFetch" }}
          simulationState={"IDLE"}
          resetEnabled={true}
          sampleProgramNames={samplePrograms}
          sourceFile={null}
          animationSpeed={"MEDIUM"}
        />
      </div>

      <hr />

      <div>Standard Toolbar (PendingExecute):</div>
      <div>
        <Toolbar
          uiString={uiString}
          showThemeSwitcher={true}
          showSamplePrograms={true}
          showSourceLoader={true}
          cpuState={{ kind: "PendingExecute" }}
          simulationState={"IDLE"}
          resetEnabled={true}
          sampleProgramNames={samplePrograms}
          sourceFile={null}
          animationSpeed={"MEDIUM"}
        />
      </div>

      <hr />

      <div>Standard Toolbar (Stopped):</div>
      <div>
        <Toolbar
          uiString={uiString}
          showThemeSwitcher={true}
          showSamplePrograms={true}
          showSourceLoader={true}
          cpuState={{ kind: "Stopped", stopResult: "STOP" }}
          simulationState={"IDLE"}
          resetEnabled={true}
          sampleProgramNames={samplePrograms}
          sourceFile={null}
          animationSpeed={"MEDIUM"}
        />
      </div>

      <hr />

      <div>EXECUTE_INSTRUCTION:</div>
      <div>
        <Toolbar
          uiString={uiString}
          showThemeSwitcher={true}
          showSamplePrograms={true}
          showSourceLoader={true}
          cpuState={{ kind: "PendingExecute" }}
          simulationState={"EXECUTE_INSTRUCTION"}
          resetEnabled={true}
          sampleProgramNames={samplePrograms}
          sourceFile={null}
          animationSpeed={"MEDIUM"}
        />
      </div>
      <div>FETCH_INSTRUCTION:</div>
      <div>
        <Toolbar
          uiString={uiString}
          showThemeSwitcher={true}
          showSamplePrograms={true}
          showSourceLoader={true}
          cpuState={{ kind: "PendingFetch" }}
          simulationState={"FETCH_INSTRUCTION"}
          resetEnabled={true}
          sampleProgramNames={samplePrograms}
          sourceFile={null}
          animationSpeed={"MEDIUM"}
        />
      </div>
      <div>SINGLE_STEP:</div>
      <div>
        <Toolbar
          uiString={uiString}
          showThemeSwitcher={true}
          showSamplePrograms={true}
          showSourceLoader={true}
          cpuState={{ kind: "PendingFetch" }}
          simulationState={"SINGLE_STEP"}
          resetEnabled={true}
          sampleProgramNames={samplePrograms}
          sourceFile={null}
          animationSpeed={"MEDIUM"}
        />
      </div>
      <div>RUN:</div>
      <div>
        <Toolbar
          uiString={uiString}
          showThemeSwitcher={true}
          showSamplePrograms={true}
          showSourceLoader={true}
          cpuState={{ kind: "PendingFetch" }}
          simulationState={"RUN"}
          resetEnabled={true}
          sampleProgramNames={samplePrograms}
          sourceFile={null}
          animationSpeed={"MEDIUM"}
        />
      </div>
      <div>STOPPING:</div>
      <div>
        <Toolbar
          uiString={uiString}
          showThemeSwitcher={true}
          showSamplePrograms={true}
          showSourceLoader={true}
          cpuState={{ kind: "PendingFetch" }}
          simulationState={"STOPPING"}
          resetEnabled={true}
          sampleProgramNames={samplePrograms}
          sourceFile={null}
          animationSpeed={"MEDIUM"}
        />
      </div>

      <hr />

      <div>No Source File:</div>
      <div>
        <Toolbar
          uiString={uiString}
          showThemeSwitcher={false}
          showSamplePrograms={false}
          showSourceLoader={true}
          cpuState={{ kind: "PendingFetch" }}
          simulationState={"IDLE"}
          resetEnabled={true}
          sampleProgramNames={[]}
          sourceFile={null}
          animationSpeed={"MEDIUM"}
        />
      </div>
      <div>Source File:</div>
      <div>
        <Toolbar
          uiString={uiString}
          showThemeSwitcher={false}
          showSamplePrograms={false}
          showSourceLoader={true}
          cpuState={{ kind: "PendingFetch" }}
          simulationState={"IDLE"}
          resetEnabled={true}
          sampleProgramNames={[]}
          sourceFile={{
            filename: "example.asm",
            info: {
              kind: "ValidSourceFile",
              id: "Example.asm",
              hasErrors: false,
            },
          }}
          animationSpeed={"MEDIUM"}
        />
      </div>
      <div>Source File with errors:</div>
      <div>
        <Toolbar
          uiString={uiString}
          showThemeSwitcher={false}
          showSamplePrograms={false}
          showSourceLoader={true}
          cpuState={{ kind: "PendingFetch" }}
          simulationState={"IDLE"}
          resetEnabled={true}
          sampleProgramNames={[]}
          sourceFile={{
            filename: "example.asm",
            info: {
              kind: "ValidSourceFile",
              id: "Example.asm",
              hasErrors: true,
            },
          }}
          animationSpeed={"MEDIUM"}
        />
      </div>
      <div>Invalid Source File:</div>
      <div>
        <Toolbar
          uiString={uiString}
          showThemeSwitcher={false}
          showSamplePrograms={false}
          showSourceLoader={true}
          cpuState={{ kind: "PendingFetch" }}
          simulationState={"IDLE"}
          resetEnabled={true}
          sampleProgramNames={[]}
          sourceFile={{
            filename: "example.py",
            info: {
              kind: "InvalidSourceFile",
              languageId: "plaintext",
            },
          }}
          animationSpeed={"MEDIUM"}
        />
      </div>
    </>
  );
}
