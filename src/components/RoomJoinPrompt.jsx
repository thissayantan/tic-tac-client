import React, { useState } from 'react';
import { Box, Button, Typography, TextField, Paper } from '@mui/material';
import AvatarSelector from './AvatarSelector'; // Assuming this component exists

export default function RoomJoinPrompt({ roomDetails, joinMode, onJoin }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');

  const getButtonText = () => {
    switch (joinMode) {
      case 'join':
        return `Join ${roomDetails?.roomCreator}'s Game`;
      case 'spectate':
        return 'Watch Game';
      case 'create':
      default:
        return 'Create Game';
    }
  };

  const getPromptText = () => {
    switch (joinMode) {
      case 'join':
        return `${roomDetails?.roomCreator} has invited you to play! Join as their opponent.`;
      case 'spectate':
        return `This game already has two players. You can join as a spectator.`;
      case 'create':
      default:
        return 'Create a new game and invite friends to play!';
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 4 }}>
      {roomDetails && (
        <Box mb={2}>
          <Typography variant="h6" color="primary">
            {getPromptText()}
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Choose your avatar:
        </Typography>
        <AvatarSelector 
          selected={avatar} 
          onSelect={setAvatar} 
        />
      </Box>

      <Button
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        disabled={!name || !avatar}
        onClick={() => onJoin({ name, avatar })}
      >
        {getButtonText()}
      </Button>
    </Paper>
  );
}
