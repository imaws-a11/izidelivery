const fs = require('fs');
const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix duplicated className
const oldClassLine = 'className="size-32 rounded-xl bg-yellow-400 flex items-center justify-center mb-10 relative"';
const nextClassLine = 'className="size-36 rounded-full bg-emerald-500 flex items-center justify-center mb-10 relative"';
if (content.includes(oldClassLine)) {
    content = content.replace(oldClassLine + '\n  ' + nextClassLine, nextClassLine);
}

// 2. Fix AnimatePresence opening
const oldOpen = `  <AnimatePresence mode="wait">
  {!isAuthenticated && (
  <div key="auth-container" className="h-full">
  {renderLoginView()}
  </div>
  )}
  {isAuthenticated && (
  <>
  <div key="app" className="flex flex-col h-full overflow-hidden bg-zinc-50">`;

const newOpen = `  <AnimatePresence mode="wait">
    {!isAuthenticated && (
      <motion.div 
        key="auth-container" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full w-full"
      >
        {renderLoginView()}
      </motion.div>
    )}
    {isAuthenticated && (
      <motion.div 
        key="app-main-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col h-full overflow-hidden bg-zinc-50"
      >`;

// Use regex to be more flexible with spaces if needed
content = content.replace(/<AnimatePresence mode="wait">\s*\{!isAuthenticated && \(\s*<div key="auth-container" className="h-full">\s*\{renderLoginView\(\)\}\s*<\/div>\s*\)\}\s*\{isAuthenticated && \(\s*<>\s*<div key="app" className="flex flex-col h-full overflow-hidden bg-zinc-50">/, newOpen);

// 3. Fix closing tags
// Find {renderBottomNavigation()} \n </div> \n </div> \n )} \n </AnimatePresence>
// Wait! showOnboarding and renderPendingApprovalModal are there too.

content = content.replace(/\{renderBottomNavigation\(\)\}\s*<\/div>\s*<\/div>\s*\)\}\s*<\/AnimatePresence>/, `{renderBottomNavigation()}
      </motion.div>
    )}
  </AnimatePresence>`);

// Also fix the case where they are inside another block
content = content.replace(/\{renderPendingApprovalModal\(\)\}\s*<>\s*\}\)\s*<\/AnimatePresence>/, `{renderPendingApprovalModal()}
      </motion.div>
    )}
  </AnimatePresence>`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Final UI structure fix applied.');
