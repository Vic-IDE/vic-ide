import {
  newComputerState,
  WRITABLE_MEMORY_SIZE,
  type ComputerState,
} from "./Computer";
import { emptyOutput } from "./Output";
import { initialCpuState, type HardwareState } from "./SimulatorState";
import { assertValidValue } from "./Value";

/**
 * Loads a program into the Computer hardware.
 *
 * @param hardwareState The current state of the computer hardware. This is
 * needed because some of the state is preserved (such as the values in the
 * Input component).
 *
 * @param program The program that should be loaded.
 *
 * @returns A new HardwareState with the given program loaded.
 */
export function loadProgram(
  hardwareState: HardwareState,
  program: number[],
): HardwareState {
  return {
    computer: newComputerWithProgram(program),
    cpuState: initialCpuState(),
    input: {
      values: hardwareState.input.values,
      next: 0,
    },
    output: emptyOutput(),
  };
}

function newComputerWithProgram(program: number[]): ComputerState {
  const computer = newComputerState();
  if (program.length > WRITABLE_MEMORY_SIZE) {
    throw new Error(`Invalid program, too large: ${JSON.stringify(program)}`);
  }

  program.forEach((value, index) => {
    computer.memory[index] = assertValidValue(value, "Invalid program");
  });

  return computer;
}
