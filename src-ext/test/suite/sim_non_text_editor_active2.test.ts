import "../infra/test_bootstrap";

import * as assert from "assert";

import * as vscode from "vscode";

import { getSimulatorManager } from "../../extension";
import { vicAsmLanguageId, vicOpenSimulatorCommand } from "../../ExtManifest";
import {
  simulatorGetSourceFile,
  waitForSimulatorReady,
} from "../../VicSimulator/VicSimulatorDebug";
import { testCase } from "../infra/TestCase";
import { step } from "../infra/TestSteps";

export const run = testCase(async (): Promise<void> => {
  const simulatorManager = await step("Open Simulator", async () => {
    await vscode.commands.executeCommand(vicOpenSimulatorCommand);
    const simulatorManager = getSimulatorManager();
    await waitForSimulatorReady(simulatorManager);
    return simulatorManager;
  });

  await step("Open Settings", async () => {
    await vscode.commands.executeCommand("workbench.action.openSettings2");
  });

  await step("Open Text Document", async () => {
    const textDocument = await vscode.workspace.openTextDocument({
      language: vicAsmLanguageId,
      content: "// Test file",
    });
    await vscode.window.showTextDocument(textDocument);
  });

  await step("Switch back to Settings", async () => {
    await vscode.commands.executeCommand("workbench.action.openEditorAtIndex2");
  });

  await step("Close Text Document", async () => {
    await vscode.commands.executeCommand(
      "workbench.action.closeEditorsToTheRight",
    );
  });

  await step("Switch back to Simulator", async () => {
    await vscode.commands.executeCommand("workbench.action.openEditorAtIndex1");
    await waitForSimulatorReady(simulatorManager);
  });

  const sourceFile = await step("Get Source File", async () => {
    return await simulatorGetSourceFile(simulatorManager);
  });

  assert.deepStrictEqual<typeof sourceFile>(sourceFile, null);
});
