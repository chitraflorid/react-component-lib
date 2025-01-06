import React, { useState, useEffect, useMemo } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';

import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
const tasks = [
  {
    task: 'Clean bedroom',
    subtasks: ['Do laundry', 'Organize desk', 'Wipe floors'],
  },
  {
    task: 'Study',
    subtasks: ['Review chemistry', 'Do a React coding challenge'],
  },
  {
    task: 'Build website',
    subtasks: ['Choose tech stack', 'Design pages', 'Develop', 'Publish'],
  },
];

const updatedTodos = tasks.map((task) => {
  console.log('task:::', task);
  task['allComplete'] = false;
  task.subtasks = task.subtasks.map((sub) => {
    const item = {
      name: sub,
      isComplete: false,
    };
    return item;
  });

  return task;
});

console.log('updatedTodos::::', updatedTodos);

export default function App() {
  //   const user = useMemo(() => {
  //     return {
  //       name: 'Chitra',
  //       pwd: 'florid',
  //     };
  //   });

  //   const [state, setState] = useState(0);
  //   const [name, setName] = useState('');
  //   const [pwd, setPwd] = useState('');
  //   const [existingUser, setExistingUser] = useState(-1);
  //   const [invalidLogin, setInvalidLogin] = useState(false);

  //   function checkUserCredentials(e) {
  //     e.preventDefault();

  //     console.log('name:::', name);
  //     console.log('pwd:::', pwd);

  //     if (name && pwd) {
  //       if (name === user.name && pwd === user.pwd) {
  //         setExistingUser(1);
  //         setInvalidLogin(false);
  //       } else if (name.length < 6 || pwd?.length < 6) {
  //         console.log('im here to set invalid msg!!');
  //         setExistingUser(-2);
  //         setInvalidLogin(true);
  //       } else {
  //         setExistingUser(0);
  //         setInvalidLogin(false);
  //       }
  //       console.log('existingUser::::', existingUser);
  //     }
  //   }

  //   return (
  //     <div>
  //       <h3>Login</h3>
  //       <label>Name</label>
  //       <input type="text" onChange={(e) => setName(e.target.value)}></input>
  //       <label>Password</label>
  //       <input type="password" onChange={(e) => setPwd(e.target.value)}></input>
  //       <button onClick={(e) => checkUserCredentials(e)}>Submit</button>

  //       {existingUser === 1 && <span>Logged in successfully!</span>}
  //       {existingUser === 0 && name && pwd && (
  //         <span>Account created successfully!</span>
  //       )}
  //       {invalidLogin && (
  //         <span> Username and pwd must be 6 characters long!</span>
  //       )}
  //     </div>
  //   );
  // }

  const [todoList, setTodoList] = useState(updatedTodos);

  const toggleTask = (parentTask, task) => {
    console.log('parentTask:::', parentTask);
    console.log('task:::', task);

    const updatedTodoList = [...todoList];

    const currParentIndex = updatedTodoList.findIndex(
      (todo) => todo?.task === parentTask
    );

    if (currParentIndex === -1) {
      console.error('Parent task not found!');
      return; 
    }

    const currentSubtasks = updatedTodoList[currParentIndex]?.subtasks?.map(
      (sub) => (sub === task ? { ...sub, isComplete: !sub.isComplete } : sub)
    );

    const allComplete = currentSubtasks?.every((sub) => sub?.isComplete);

    updatedTodoList[currParentIndex] = {
      ...updatedTodoList[currParentIndex],
      subtasks: currentSubtasks,
      allComplete,
    };

    setTodoList(updatedTodoList);
  };

  const clearCompletedTasks = () => {
    const incompleteList = todoList.filter((todo) => !todo?.allComplete);

    setTodoList([...incompleteList]);
  };

  const taskList = todoList?.map((list) => (
    <>
      <h4
        style={{ textDecoration: list.allComplete ? 'line-through' : 'none' }}
      >
        {list.task}{' '}
      </h4>
      <ul>
        {list.subtasks.map((subtask) => (
          <li
            style={{
              textDecoration: subtask.isComplete ? 'line-through' : 'none',
            }}
            onClick={(e) => toggleTask(list.task, subtask)}
          >
            {subtask.name}
          </li>
        ))}
      </ul>
    </>
  ));

  return (
    <>
      <button onClick={(e) => clearCompletedTasks()}>
        Clear Completed Tasks
      </button>
      {taskList}
    </>
  );
}
