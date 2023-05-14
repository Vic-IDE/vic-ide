import "./App.css"; // eslint-disable-line @typescript-eslint/no-import-type-side-effects
import * as React from "react";
import {
  type AnimationSpeed,
  animationSpeedDuration,
} from "./UI/Simulator/AnimationSpeed";
import { Computer, type ComputerHandle } from "./UI/Simulator/Computer";
import {
  type HardwareState,
  type SimulatorState,
  newSimulatorState,
} from "./Computer/SimulatorState";
import { type InputState, consumeInput, readNextInput } from "./Computer/Input";
import { emptyOutput, processExecuteResult } from "./Computer/Output";
import {
  executeInstruction,
  fetchInstruction,
  setDataRegister,
  setInstructionRegister,
  setProgramCounter,
  writeMemory,
} from "./Computer/Computer";
import {
  getExampleProgramNames,
  loadExampleProgram,
  lookupExampleProgram,
} from "./Examples/ExampleProgram";
import type { Address } from "./Computer/Instruction";
import type { SystemStateService } from "./System/SystemState";
import { Toolbar } from "./UI/Toolbar";
import type { Value } from "./Computer/Value";
import { nextInstructionAnimation } from "./UI/Simulator/Animations";
import { nonNull } from "./Functional/Nullability";
import { useAnimate } from "./UI/UseAnimate";

export interface AppProps {
  systemStateService: SystemStateService<SimulatorState>;
}

/**
 * Initializes an initial state, by either loading a saved state from the
 * SystemStateService, or if there is no saved state, creating a new empty
 * state.
 */
function initSimulatorState(
  systemStateService: SystemStateService<SimulatorState>
): SimulatorState {
  const savedState = systemStateService.getState();
  if (savedState !== undefined) {
    return savedState;
  } else {
    return newSimulatorState();
  }
}

function App(props: AppProps): JSX.Element {
  const { systemStateService } = props;

  const initialState = React.useMemo(
    () => initSimulatorState(systemStateService),
    [systemStateService]
  );

  const [computer, setComputer] = React.useState(
    initialState.hardwareState.computer
  );
  const [input, setInput] = React.useState(initialState.hardwareState.input);
  const [output, setOutput] = React.useState(initialState.hardwareState.output);
  const [animationSpeed, setAnimationSpeed] = React.useState(
    initialState.animationSpeed
  );

  const [animating, setAnimating] = React.useState<boolean>(false);
  const [running, setRunning] = React.useState<boolean>(false);

  const computerRef = React.useRef<ComputerHandle>(null);

  // Whenever any part of the `SimulatorState` changes (`computer`, `input`,
  // `output`, or `animationSpeed`), we send a message to the
  // `systemStateService` to persist the updated state.
  React.useEffect(() => {
    systemStateService.setState({
      hardwareState: {
        computer: computer,
        input: input,
        output: output,
      },
      animationSpeed: animationSpeed,
    });
  }, [animationSpeed, computer, input, output, systemStateService]);

  const animate = useAnimate();

  const handleLoadExample = React.useCallback((example: string): void => {
    const exampleProgram = lookupExampleProgram(example);
    if (exampleProgram !== null) {
      const hardware = loadExampleProgram(exampleProgram);
      setComputer(hardware.computer);
      setInput(hardware.input);
      setOutput(hardware.output);
    }
  }, []);

  const handleAnimationSpeedChange = React.useCallback(
    (value: AnimationSpeed): void => {
      setAnimationSpeed(value);
    },
    []
  );

  const doFetchInstruction = React.useCallback(
    (
      hardwareState: HardwareState,
      onComplete?: (hardwareState: HardwareState) => void
    ): void => {
      setAnimating(true);

      nonNull(computerRef.current).scrollIntoView({
        kind: "MemoryCell",
        address: hardwareState.computer.programCounter,
      });

      const startRect = nonNull(computerRef.current).getBoundingClientRect({
        kind: "MemoryCell",
        address: hardwareState.computer.programCounter,
      });

      const newComputer = fetchInstruction(hardwareState.computer);

      const endRect = nonNull(computerRef.current).getBoundingClientRect({
        kind: "CpuRegister",
        cpuRegister: "INSTRUCTION_REGISTER",
      });

      animate(
        {
          start: startRect,
          end: endRect,
          duration: animationSpeedDuration(animationSpeed),
          text: `${newComputer.instructionRegister}`,
          className: "App-CellAnimationCont",
        },
        (): void => {
          setComputer(newComputer);
          setAnimating(false);
          if (onComplete !== undefined) {
            onComplete({
              computer: newComputer,
              input: hardwareState.input,
              output: hardwareState.output,
            });
          }
        }
      );
    },
    [animate, animationSpeed]
  );

  const doExecuteInstruction = React.useCallback(
    (
      hardwareState: HardwareState,
      onComplete?: (hardwareState: HardwareState | null) => void
    ): void => {
      const nextInput = readNextInput(hardwareState.input);

      function updateComputer(): HardwareState | null {
        const [newComputer, executeResult] = executeInstruction(
          hardwareState.computer,
          nextInput
        );
        setComputer(newComputer);
        const newInput = executeResult.consumedInput
          ? consumeInput(hardwareState.input)
          : hardwareState.input;
        setInput(newInput);
        const newOutput = processExecuteResult(executeResult)(
          hardwareState.output
        );
        setOutput(newOutput);

        if (executeResult.stop !== null) {
          return null;
        }

        return {
          computer: newComputer,
          input: newInput,
          output: newOutput,
        };
      }

      const animation = nextInstructionAnimation(
        hardwareState.computer,
        nextInput
      );
      if (animation === null) {
        const newHardwareState = updateComputer();
        if (onComplete !== undefined) {
          onComplete(newHardwareState);
        }
        return;
      }

      nonNull(computerRef.current).scrollIntoView(animation.start);
      nonNull(computerRef.current).scrollIntoView(animation.end);

      setAnimating(true);

      animate(
        {
          start: nonNull(computerRef.current).getBoundingClientRect(
            animation.start
          ),
          end: nonNull(computerRef.current).getBoundingClientRect(
            animation.end
          ),
          duration: animationSpeedDuration(animationSpeed),
          text: `${animation.value}`,
          className: "App-CellAnimationCont",
        },
        () => {
          const newHardwareState = updateComputer();
          setAnimating(false);
          if (onComplete !== undefined) {
            onComplete(newHardwareState);
          }
        }
      );
    },
    [animate, animationSpeed]
  );

  const handleFetchInstructionClick = React.useCallback((): void => {
    doFetchInstruction({
      computer: computer,
      input: input,
      output: output,
    });
  }, [computer, doFetchInstruction, input, output]);

  const handleExecuteInstructionClick = React.useCallback((): void => {
    doExecuteInstruction({
      computer: computer,
      input: input,
      output: output,
    });
  }, [computer, doExecuteInstruction, input, output]);

  const handleSingleStepClick = React.useCallback((): void => {
    doFetchInstruction(
      {
        computer: computer,
        input: input,
        output: output,
      },
      (hardwareState) => {
        doExecuteInstruction(hardwareState);
      }
    );
  }, [computer, doExecuteInstruction, doFetchInstruction, input, output]);

  const handleRunClick = React.useCallback((): void => {
    setRunning(true);
    function go(hardwareState: HardwareState): void {
      doFetchInstruction(hardwareState, (hardwareState) => {
        doExecuteInstruction(hardwareState, (hardwareState) => {
          if (hardwareState === null) {
            setRunning(false);
            return;
          }

          go(hardwareState);
        });
      });
    }

    go({
      computer: computer,
      input: input,
      output: output,
    });
  }, [computer, doExecuteInstruction, doFetchInstruction, input, output]);

  const handleStopClick = React.useCallback((): void => {
    // TODO !!!
  }, []);

  const handleClearOutputClick = React.useCallback((): void => {
    setOutput(emptyOutput());
  }, []);

  const handleMemoryCellChange = React.useCallback(
    (address: Address, value: Value | null): void => {
      setComputer(writeMemory(address, value));
    },
    []
  );

  const handleInstructionRegister = React.useCallback((value: Value): void => {
    setComputer(setInstructionRegister(value));
  }, []);

  const handleDataRegisterChange = React.useCallback((value: Value): void => {
    setComputer(setDataRegister(value));
  }, []);

  const handleProgramCounterChange = React.useCallback((value: Value): void => {
    setComputer(setProgramCounter(value));
  }, []);

  const handleInputChange = React.useCallback((input: InputState): void => {
    setInput(input);
  }, []);

  return (
    <div className="App-Root">
      <Toolbar
        className="App-Toolbar-Cont"
        animating={animating}
        running={running}
        examples={getExampleProgramNames()}
        onLoadExample={handleLoadExample}
        animationSpeed={animationSpeed}
        onAnimationSpeedChange={handleAnimationSpeedChange}
        onFetchInstructionClick={handleFetchInstructionClick}
        onExecuteInstructionClick={handleExecuteInstructionClick}
        onSingleStepClick={handleSingleStepClick}
        onRunClick={handleRunClick}
        onStopClick={handleStopClick}
      />
      <Computer
        ref={computerRef}
        className="App-Computer-Cont"
        animating={animating}
        computer={computer}
        input={input}
        output={output}
        onClearOutputClick={handleClearOutputClick}
        onMemoryCellChange={handleMemoryCellChange}
        onInstructionRegister={handleInstructionRegister}
        onDataRegisterChange={handleDataRegisterChange}
        onProgramCounterChange={handleProgramCounterChange}
        onInputChange={handleInputChange}
      />
    </div>
  );
}

export default App;
