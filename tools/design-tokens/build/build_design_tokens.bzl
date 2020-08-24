load("@build_bazel_rules_nodejs//:providers.bzl", "JSModuleInfo", "run_node")
load("//tools/bazel_rules:helpers.bzl", "filter_files")

def _declare_output_files(ctx, files, target_extensions):
    """Declares  files for design token generation outputs.
    """
    output_files = []

    for file in files:
        target_base_name = file.basename.replace(file.extension, "")

        for extension in target_extensions:
            target_file_name = "%s.%s" % (target_base_name, extension)
            output_files.append(ctx.actions.declare_file(target_file_name))

    return output_files

def _build_design_tokens_impl(ctx):
    entrypoint_files = []
    for entrypoint_label in ctx.attr.entrypoints:
      entrypoint_files.extend(entrypoint_label.files.to_list())

    aliases_entrypoint_files = []
    for entrypoint_label in ctx.attr.aliases_entrypoints:
      aliases_entrypoint_files.extend(entrypoint_label.files.to_list())

    inputs = []
    inputs.extend(entrypoint_files)
    inputs.extend(aliases_entrypoint_files)

    outputs = []
    outputs.extend(_declare_output_files(ctx, entrypoint_files, ["js", "scss", "ts", "json"]))
    outputs.extend(_declare_output_files(ctx, aliases_entrypoint_files, ["json"]))

    args = []
    args.append("--entrypoints")
    args.extend([file.path for file in entrypoint_files])
    args.append("--aliases-entrypoints")
    args.extend([file.path for file in aliases_entrypoint_files])

    ctx.actions.run(
        mnemonic = "DesignTokensBuild",
        progress_message = "Building Design Tokens",
        executable = ctx.executable._builder_bin,
        arguments = args,
        inputs = inputs,
        outputs = outputs,
        tools = [ctx.executable._builder_bin]
    )

    return [DefaultInfo(files = depset(outputs))]

build_design_tokens = rule(
    implementation = _build_design_tokens_impl,
    attrs = {
        "_builder_bin": attr.label(
            doc = "Target that executes the design tokens builder binary",
            executable = True,
            cfg = "host",
            default = "//tools/design-tokens/build:builder-binary",
        ),
        "entrypoints": attr.label_list(
            allow_files = True,
            default = [],
            doc = "Entry point tokens .yml files",
        ),
        "aliases_entrypoints": attr.label_list(
            allow_files = True,
            default = [],
            doc = "Alias entry point tokens .yml files",
        ),
    },
)
