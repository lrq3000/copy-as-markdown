const webpack = require('webpack');
const config = require('../webpack.config');

describe('content script bundle', () => {
  it('does not bundle Domino into the injected selection script', (done) => {
    const inspectedAssets: {[name: string]: string} = {};
    const webpackConfig = {
      ...config,
      plugins: [
        ...(config.plugins || []),
        {
          apply(compiler: any) {
            compiler.hooks.thisCompilation.tap('InspectContentScriptAssets', (compilation: any) => {
              compilation.hooks.processAssets.tap(
                {
                  name: 'InspectContentScriptAssets',
                  stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT
                },
                (assets: {[name: string]: any}) => {
                  for (const [name, source] of Object.entries(assets)) {
                    if (name === 'content_script_get_selection.bundle.js') {
                      inspectedAssets[name] = source.source().toString();
                    }
                  }
                }
              );
            });

            // The test only inspects the generated asset text. Avoid writing a
            // throwaway dist tree while still exercising Webpack's real graph.
            compiler.hooks.shouldEmit.tap('InspectContentScriptAssets', () => false);
          }
        }
      ]
    };

    webpack(webpackConfig, (err: Error | undefined, stats: any) => {
      if (err) {
        done(err);
        return;
      }

      const info = stats.toJson({all: false, errors: true});
      if (info.errors && info.errors.length) {
        done(new Error(info.errors.map((error: any) => error.message || error).join('\n')));
        return;
      }

      const selectionBundle = inspectedAssets['content_script_get_selection.bundle.js'];
      expect(selectionBundle).toBeDefined();
      expect(selectionBundle).not.toContain('@mixmark-io/domino');
      expect(selectionBundle).not.toContain('createDocument');
      done();
    });
  }, 30000);
});
