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
  await step("Open Plain Text Document", async () => {
    const textDocument = await vscode.workspace.openTextDocument({
      content: "Plain Text File",
    });
    await vscode.window.showTextDocument(textDocument);
  });

  await step("Open Vic File", async () => {
    const textDocument = await vscode.workspace.openTextDocument({
      language: vicAsmLanguageId,
      content: "// Test file",
    });
    await vscode.window.showTextDocument(textDocument);
  });

  const simulatorManager = await step("Open Simulator", async () => {
    await vscode.commands.executeCommand(vicOpenSimulatorCommand);
    const simulatorManager = getSimulatorManager();
    await waitForSimulatorReady(simulatorManager);
    return simulatorManager;
  });

  const sourceFile1 = await step("Get Source File", async () => {
    return await simulatorGetSourceFile(simulatorManager);
  });

  assert.deepStrictEqual<typeof sourceFile1>(sourceFile1, {
    filename: "Untitled-2",
    info: {
      kind: "ValidSourceFile",
      id: "untitled:Untitled-2",
      hasErrors: false,
    },
  });

  await step("Switch back to first Text Document", async () => {
    await vscode.commands.executeCommand("workbench.action.nextEditor");
    await waitForSimulatorReady(simulatorManager);
  });

  const sourceFile2 = await step("Get Source File", async () => {
    return await simulatorGetSourceFile(simulatorManager);
  });

  assert.deepStrictEqual<typeof sourceFile2>(sourceFile2, {
    filename: "Untitled-1",
    info: {
      kind: "InvalidSourceFile",
      languageId: "plaintext",
    },
  });
});
