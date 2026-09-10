const { withXcodeProject } = require("expo/config-plugins");

const unsafeInvocation =
  '`"$NODE_BINARY" --print "require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'"`';

const safeInvocation = [
  'REACT_NATIVE_XCODE_SCRIPT="$("$NODE_BINARY" --print "require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'")"',
  '"$REACT_NATIVE_XCODE_SCRIPT"',
].join("\n");

function decodeShellScript(shellScript) {
  if (!shellScript.startsWith('"')) {
    return { quoted: false, value: shellScript };
  }

  try {
    return { quoted: true, value: JSON.parse(shellScript) };
  } catch {
    return { quoted: false, value: shellScript };
  }
}

/**
 * Expo SDK 54's iOS template executes a Node-resolved script path through
 * backticks. The returned path is then split by the shell when the project is
 * inside a directory containing spaces. Resolve it into a variable and invoke
 * the quoted variable instead.
 */
module.exports = function withPathSafeIosBuildScripts(config) {
  return withXcodeProject(config, (configWithProject) => {
    const buildPhases =
      configWithProject.modResults.hash.project.objects
        .PBXShellScriptBuildPhase ?? {};

    for (const phase of Object.values(buildPhases)) {
      if (!phase || typeof phase !== "object") continue;
      if (typeof phase.shellScript !== "string") continue;

      const script = decodeShellScript(phase.shellScript);
      if (!script.value.includes(unsafeInvocation)) continue;

      const updated = script.value.replace(unsafeInvocation, safeInvocation);
      phase.shellScript = script.quoted ? JSON.stringify(updated) : updated;
    }

    return configWithProject;
  });
};
