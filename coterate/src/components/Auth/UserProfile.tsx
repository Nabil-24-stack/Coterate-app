import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const ProfileContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background-color: white;
  color: #333;
  border-radius: 8px;
  transition: background-color 0.2s;
  width: 100%;
  cursor: pointer;
  border: 1px solid #E3E6EA;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const UserEmail = styled.span`
  font-size: 14px;
  color: #333;
  font-weight: 500;
`;

const UserType = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 180px;
  display: ${props => (props.isOpen ? 'block' : 'none')};
  z-index: 1000;
  overflow: hidden;
  border: 1px solid #E3E6EA;
`;

const MenuItem = styled.div`
  padding: 12px 16px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &.sign-out {
    color: #ef4444;
    border-top: 1px solid #E3E6EA;
  }
`;

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  if (!user) {
    return null;
  }
  
  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsMenuOpen(prevState => !prevState);
  };
  
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <ProfileContainer ref={profileRef} onClick={toggleMenu}>
        <UserInfo>
          <UserEmail>{user.email}</UserEmail>
          <UserType>Free</UserType>
        </UserInfo>
      </ProfileContainer>
      
      <div ref={menuRef}>
        <DropdownMenu isOpen={isMenuOpen}>
          <MenuItem className="sign-out" onClick={handleSignOut}>
            Sign Out
          </MenuItem>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default UserProfile; 